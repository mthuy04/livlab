import { Prisma, type LeadStage } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { legacyStatusForStage, resolveStage } from './leadStage';
import { requireOwnedLead, withSchemaGuard } from './guards';

/**
 * The only place a lead's pipeline stage changes.
 *
 * Two columns describe where a lead stands: the legacy `status`, which existing
 * screens still read, and the richer `stage`. Keeping them consistent is a
 * single rule, so it lives in one function rather than being re-derived by each
 * component that happens to move a lead.
 *
 * The rule: write `stage` always; write `status` only where the legacy enum has
 * an honest equivalent. QUALIFIED, QUOTING and FOLLOW_UP have none, so `status`
 * is left exactly as it was — telling an old screen "CONTACTED" when the lead
 * is mid-quotation would be a lie that is worse than a stale value.
 */
export async function changeStage(params: {
  leadId: string;
  showroomId: string;
  toStage: LeadStage;
  createdById?: string | null;
  /** Required by the UI when closing as LOST; free text, not an enum. */
  reason?: string | null;
}) {
  const { leadId, showroomId, toStage, createdById, reason } = params;

  return withSchemaGuard(async () => {
    const lead = await requireOwnedLead(leadId, showroomId);
    const fromStage = resolveStage(lead);
    if (fromStage === toStage) return lead;

    const legacyStatus = legacyStatusForStage(toStage);

    return prisma.$transaction(async (tx) => {
      const updated = await tx.quoteLead.update({
        where: { id: leadId },
        data: {
          stage: toStage,
          ...(legacyStatus ? { status: legacyStatus } : {}),
        },
      });

      // The move itself is history. Recorded with structured endpoints so a
      // timeline can render "QUALIFIED → QUOTING" without parsing prose.
      await tx.leadActivity.create({
        data: {
          leadId,
          showroomId,
          type: 'STAGE_CHANGE',
          body: reason ?? null,
          metadataJson: {
            from: fromStage,
            to: toStage,
            legacyStatusWritten: legacyStatus ?? null,
          } satisfies Prisma.InputJsonValue,
          doneAt: new Date(),
          createdById: createdById ?? null,
        },
      });

      return updated;
    });
  });
}

/** Assigns a lead, having proved the assignee belongs to this showroom. */
export async function assignLead(params: {
  leadId: string;
  showroomId: string;
  assignedToId: string | null;
}) {
  const { leadId, showroomId, assignedToId } = params;
  return withSchemaGuard(async () => {
    await requireOwnedLead(leadId, showroomId);
    const { requireShowroomMember } = await import('./guards');
    const verified = await requireShowroomMember(assignedToId, showroomId);
    return prisma.quoteLead.update({
      where: { id: leadId },
      data: { assignedToId: verified },
    });
  });
}
