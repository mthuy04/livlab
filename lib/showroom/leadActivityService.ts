import { Prisma, type LeadActivityType, type LeadNextActionType } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireOwnedLead, withSchemaGuard } from './guards';

/**
 * The only place LeadActivity and QuoteLead.nextAction* are written.
 *
 * LeadActivity is canonical: every past event and every scheduled follow-up is
 * a row. QuoteLead.nextActionType/At/Note is a DENORMALISED copy of whichever
 * scheduled activity comes next, kept so the dashboard can ask "what is due
 * today" without joining the whole activity table per lead.
 *
 * Two representations of one fact drift the moment two call sites can write
 * them, so they are written together, in one transaction, here — and nowhere
 * else. UI and route handlers call these functions rather than prisma.
 */

/** Activity types that count as having actually reached the customer. */
const CONTACT_TYPES: LeadActivityType[] = ['CALL', 'MESSAGE', 'MEETING'];

export interface LogActivityInput {
  leadId: string;
  showroomId: string;
  type: LeadActivityType;
  body?: string | null;
  metadata?: Prisma.InputJsonValue | null;
  /** Set for a scheduled action; omitted for something that already happened. */
  dueAt?: Date | null;
  /** Defaults to now for an immediate event, null for a scheduled one. */
  doneAt?: Date | null;
  createdById?: string | null;
}

/**
 * Recomputes the denormalised next-action summary from the activity rows.
 *
 * The next action is the earliest activity that is scheduled and not yet done.
 * When there is none the summary is cleared, so a lead never advertises work
 * that was already completed.
 */
async function syncNextAction(tx: Prisma.TransactionClient, leadId: string): Promise<void> {
  const next = await tx.leadActivity.findFirst({
    where: { leadId, dueAt: { not: null }, doneAt: null },
    orderBy: { dueAt: 'asc' },
  });

  await tx.quoteLead.update({
    where: { id: leadId },
    data: {
      nextActionType: next ? toNextActionType(next.type) : null,
      nextActionAt: next?.dueAt ?? null,
      nextActionNote: next?.body ?? null,
    },
  });
}

/** Maps a timeline type onto the smaller set of things that can be scheduled. */
function toNextActionType(type: LeadActivityType): LeadNextActionType {
  switch (type) {
    case 'CALL':
      return 'CALL';
    case 'MESSAGE':
      return 'MESSAGE';
    case 'MEETING':
      return 'MEETING';
    case 'QUOTE_SENT':
      return 'SEND_QUOTE';
    case 'TECHNICAL_CHECK':
      return 'TECHNICAL_CHECK';
    default:
      return 'FOLLOW_UP';
  }
}

/**
 * Stamps the first real contact, once.
 *
 * Guarded by `firstContactAt: null` in the WHERE clause rather than read-then-
 * write, so two concurrent activities cannot both decide they were first. An
 * overwritten value would silently destroy the only basis for response-time
 * reporting.
 */
async function stampFirstContact(
  tx: Prisma.TransactionClient,
  leadId: string,
  at: Date
): Promise<void> {
  await tx.quoteLead.updateMany({
    where: { id: leadId, firstContactAt: null },
    data: { firstContactAt: at },
  });
}

export async function logActivity(input: LogActivityInput) {
  const { leadId, showroomId } = input;

  return withSchemaGuard(async () => {
    // Proven before the transaction so a cross-tenant write never opens one.
    await requireOwnedLead(leadId, showroomId);

    return prisma.$transaction(async (tx) => {
      const isScheduled = Boolean(input.dueAt);
      const doneAt = input.doneAt ?? (isScheduled ? null : new Date());

      const activity = await tx.leadActivity.create({
        data: {
          leadId,
          showroomId,
          type: input.type,
          body: input.body ?? null,
          metadataJson: input.metadata ?? Prisma.DbNull,
          dueAt: input.dueAt ?? null,
          doneAt,
          createdById: input.createdById ?? null,
        },
      });

      if (doneAt && CONTACT_TYPES.includes(input.type)) {
        await stampFirstContact(tx, leadId, doneAt);
      }

      await syncNextAction(tx, leadId);
      return activity;
    });
  });
}

/** Marks a scheduled activity done and re-points the lead at whatever is next. */
export async function completeActivity(
  activityId: string,
  showroomId: string,
  completedAt: Date = new Date()
) {
  return withSchemaGuard(async () => {
    const activity = await prisma.leadActivity.findUnique({ where: { id: activityId } });
    if (!activity || activity.showroomId !== showroomId) {
      throw new Error('Không tìm thấy hoạt động của showroom này.');
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tx.leadActivity.update({
        where: { id: activityId },
        data: { doneAt: completedAt },
      });

      if (CONTACT_TYPES.includes(updated.type)) {
        await stampFirstContact(tx, updated.leadId, completedAt);
      }

      await syncNextAction(tx, updated.leadId);
      return updated;
    });
  });
}

/** Full timeline for a lead, newest first. */
export async function listActivities(leadId: string, showroomId: string) {
  return withSchemaGuard(async () => {
    await requireOwnedLead(leadId, showroomId);
    return prisma.leadActivity.findMany({
      where: { leadId },
      orderBy: { createdAt: 'desc' },
      include: { createdBy: { select: { id: true, name: true, email: true } } },
    });
  });
}
