import type { LeadStage, LeadRequestType } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { resolveStage, STAGE_ORDER, isOpenStage } from './leadStage';
import { withSchemaGuard } from './guards';

/**
 * Read models for the showroom workspace.
 *
 * Queries and shaping live here so components receive something they can
 * render directly. Every query is scoped by showroomId — the caller passes the
 * one proven by requireShowroomId, never a value from a request body.
 */

const LEAD_SELECT = {
  id: true,
  customerName: true,
  phone: true,
  email: true,
  roomType: true,
  budgetMin: true,
  budgetMax: true,
  budgetRange: true,
  estimatedValue: true,
  conceptName: true,
  notes: true,
  status: true,
  stage: true,
  requestType: true,
  nextActionType: true,
  nextActionAt: true,
  nextActionNote: true,
  firstContactAt: true,
  contextJson: true,
  assignedToId: true,
  createdAt: true,
  updatedAt: true,
} as const;

export interface LeadListItem {
  id: string;
  customerName: string;
  phone: string | null;
  requestType: LeadRequestType | null;
  stage: LeadStage;
  productCount: number;
  contextSummary: string | null;
  estimatedValue: number | null;
  targetBudget: number | null;
  nextActionAt: Date | null;
  nextActionNote: string | null;
  assigneeName: string | null;
  createdAt: Date;
  /** Hours since creation with no contact yet; null once contacted. */
  uncontactedHours: number | null;
}

function hoursSince(date: Date): number {
  return Math.floor((Date.now() - date.getTime()) / 3_600_000);
}

/**
 * A one-line description of what the customer brought with them.
 *
 * Built from the structured snapshot when one exists; otherwise from whatever
 * columns do exist. Returns null rather than a placeholder when LivLab knows
 * nothing — an empty cell is honest, "N/A" is noise.
 */
function summariseContext(lead: {
  roomType: string | null;
  conceptName: string | null;
  contextJson: unknown;
  itemCount: number;
}): string | null {
  const parts: string[] = [];
  const ctx = lead.contextJson as { room?: { length?: number; width?: number } } | null;

  if (lead.itemCount > 0) parts.push(`${lead.itemCount} sản phẩm`);
  if (ctx?.room?.length && ctx.room.width) {
    parts.push(`Phòng ${ctx.room.length}×${ctx.room.width}m`);
  } else if (lead.roomType) {
    parts.push(lead.roomType);
  }
  if (lead.conceptName) {
    parts.push(lead.conceptName.replace(/^Room Studio · /, ''));
  }
  return parts.length > 0 ? parts.join(' · ') : null;
}

export async function listLeads(params: {
  showroomId: string;
  stage?: LeadStage | null;
  requestType?: LeadRequestType | null;
  search?: string | null;
  take?: number;
  skip?: number;
}): Promise<{ items: LeadListItem[]; total: number }> {
  const { showroomId, stage, requestType, search, take = 50, skip = 0 } = params;

  return withSchemaGuard(async () => {
    const where = {
      showroomId,
      ...(requestType ? { requestType } : {}),
      ...(search
        ? {
            OR: [
              { customerName: { contains: search, mode: 'insensitive' as const } },
              { phone: { contains: search } },
            ],
          }
        : {}),
    };

    const [rows, total] = await Promise.all([
      prisma.quoteLead.findMany({
        where,
        select: {
          ...LEAD_SELECT,
          _count: { select: { items: true } },
          assignedTo: { select: { name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        take,
        skip,
      }),
      prisma.quoteLead.count({ where }),
    ]);

    const items = rows
      .map((lead) => ({
        id: lead.id,
        customerName: lead.customerName,
        phone: lead.phone,
        requestType: lead.requestType,
        stage: resolveStage(lead),
        productCount: lead._count.items,
        contextSummary: summariseContext({
          roomType: lead.roomType,
          conceptName: lead.conceptName,
          contextJson: lead.contextJson,
          itemCount: lead._count.items,
        }),
        estimatedValue: lead.estimatedValue,
        targetBudget: lead.budgetMax ?? lead.budgetMin,
        nextActionAt: lead.nextActionAt,
        nextActionNote: lead.nextActionNote,
        assigneeName: lead.assignedTo?.name ?? lead.assignedTo?.email ?? null,
        createdAt: lead.createdAt,
        uncontactedHours: lead.firstContactAt ? null : hoursSince(lead.createdAt),
      }))
      // Stage is partly derived, so it cannot be filtered in SQL without
      // backfilling. The page size is small and bounded, so filtering here is
      // cheaper than writing data we promised not to touch.
      .filter((lead) => (stage ? lead.stage === stage : true));

    return { items, total: stage ? items.length : total };
  });
}

export async function getLeadDetail(leadId: string, showroomId: string) {
  return withSchemaGuard(async () => {
    const lead = await prisma.quoteLead.findFirst({
      where: { id: leadId, showroomId },
      select: {
        ...LEAD_SELECT,
        assignedTo: { select: { id: true, name: true, email: true } },
        items: { include: { product: true } },
        quotes: {
          orderBy: { createdAt: 'desc' },
          select: { id: true, code: true, status: true, total: true, createdAt: true, sentAt: true },
        },
        activities: {
          orderBy: { createdAt: 'desc' },
          include: { createdBy: { select: { name: true, email: true } } },
        },
      },
    });
    if (!lead) return null;
    return { ...lead, effectiveStage: resolveStage(lead) };
  });
}

export interface DashboardViewModel {
  newLeads: number;
  uncontacted: number;
  uncontactedOverdue: number;
  quoteFollowUps: number;
  technicalChecks: number;
  /** Open opportunity value. Explicitly NOT revenue — nothing here is closed. */
  pipelineValue: number;
  pipeline: { stage: LeadStage; label: string; count: number; value: number }[];
  actionQueue: LeadListItem[];
}

/**
 * Everything the "what do I do today" screen needs, in one pass.
 *
 * `pipelineValue` sums open leads only and is never labelled revenue: it is
 * the value of work in progress, which is a different claim from money earned.
 */
export async function getDashboard(showroomId: string): Promise<DashboardViewModel> {
  return withSchemaGuard(async () => {
    const { items } = await listLeads({ showroomId, take: 500 });

    const open = items.filter((l) => isOpenStage(l.stage));
    const now = Date.now();

    const pipeline = STAGE_ORDER.map((stage) => {
      const inStage = items.filter((l) => l.stage === stage);
      return {
        stage,
        label: stage,
        count: inStage.length,
        value: inStage.reduce((sum, l) => sum + (l.estimatedValue ?? 0), 0),
      };
    });

    // Anything due, overdue, or never contacted — ordered by how late it is.
    const actionQueue = open
      .filter((l) => (l.nextActionAt ? l.nextActionAt.getTime() <= now + 86_400_000 : l.uncontactedHours !== null))
      .sort((a, b) => {
        const aKey = a.nextActionAt?.getTime() ?? a.createdAt.getTime();
        const bKey = b.nextActionAt?.getTime() ?? b.createdAt.getTime();
        return aKey - bKey;
      })
      .slice(0, 12);

    return {
      newLeads: items.filter((l) => l.stage === 'NEW').length,
      uncontacted: items.filter((l) => l.uncontactedHours !== null && isOpenStage(l.stage)).length,
      uncontactedOverdue: items.filter(
        (l) => l.uncontactedHours !== null && l.uncontactedHours > 24 && isOpenStage(l.stage)
      ).length,
      quoteFollowUps: items.filter((l) => l.stage === 'QUOTE_SENT' || l.stage === 'FOLLOW_UP').length,
      technicalChecks: items.filter((l) => l.requestType === 'TECHNICAL_CHECK' && isOpenStage(l.stage)).length,
      pipelineValue: open.reduce((sum, l) => sum + (l.estimatedValue ?? 0), 0),
      pipeline,
      actionQueue,
    };
  });
}
