import type { LeadStage, LeadRequestType, LeadStatus, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { resolveStage, STAGE_ORDER, isOpenStage } from './leadStage';
import { isTestRecord } from './testRecords';
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
  requestCode: true,
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
  requestCode: string | null;
  customerName: string;
  phone: string | null;
  requestType: LeadRequestType | null;
  stage: LeadStage;
  productCount: number;
  contextSummary: string | null;
  estimatedValue: number | null;
  targetBudget: number | null;
  budgetRange: string | null;
  nextActionAt: Date | null;
  nextActionNote: string | null;
  firstContactAt: Date | null;
  assigneeName: string | null;
  createdAt: Date;
  /** Hours since creation with no contact yet; null once contacted. */
  uncontactedHours: number | null;
  /**
   * A record created by QA rather than by a customer.
   *
   * Flagged, never deleted: these rows live in a database other environments
   * share, and "xoa duoc" in someone's test name is their note to themselves,
   * not permission. The workspace hides them from operational views by default
   * and says how many it hid.
   */
  isTestRecord: boolean;
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
  from?: Date | null;
  to?: Date | null;
  uncontactedOnly?: boolean;
  overdueOnly?: boolean;
  /** Null is reserved for trusted aggregate callers that need the full set. */
  take?: number | null;
  skip?: number;
}): Promise<{ items: LeadListItem[]; total: number }> {
  const {
    showroomId, stage, requestType, search, from, to,
    uncontactedOnly = false, overdueOnly = false, take = 50, skip = 0,
  } = params;

  return withSchemaGuard(async () => {
    const legacyByStage: Partial<Record<LeadStage, LeadStatus>> = {
      NEW: 'NEW', CONTACTED: 'CONTACTED', QUOTE_SENT: 'QUOTED', WON: 'WON', LOST: 'LOST',
    };
    const legacy = stage ? legacyByStage[stage] : undefined;
    const now = new Date();
    const uncontactedCutoff = new Date(now.getTime() - 86_400_000);
    const filters: Prisma.QuoteLeadWhereInput[] = [];
    if (stage) filters.push({ OR: [{ stage }, ...(legacy ? [{ stage: null, status: legacy }] : [])] });
    if (from || to) filters.push({ createdAt: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } });
    if (uncontactedOnly) filters.push({ firstContactAt: null });
    if (overdueOnly) {
      filters.push({
        OR: [
          { nextActionAt: { lt: now } },
          { firstContactAt: null, nextActionAt: null, createdAt: { lt: uncontactedCutoff } },
        ],
      });
    }
    if (search) {
      filters.push({
        OR: [
          { customerName: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search } },
          { requestCode: { contains: search, mode: 'insensitive' } },
        ],
      });
    }
    const where: Prisma.QuoteLeadWhereInput = {
      showroomId,
      ...(requestType ? { requestType } : {}),
      ...(filters.length > 0 ? { AND: filters } : {}),
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
        take: take ?? undefined,
        skip,
      }),
      prisma.quoteLead.count({ where }),
    ]);

    const items = rows
      .map((lead) => ({
        id: lead.id,
        requestCode: lead.requestCode,
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
        budgetRange: lead.budgetRange,
        nextActionAt: lead.nextActionAt,
        nextActionNote: lead.nextActionNote,
        firstContactAt: lead.firstContactAt,
        assigneeName: lead.assignedTo?.name ?? lead.assignedTo?.email ?? null,
        createdAt: lead.createdAt,
        uncontactedHours: lead.firstContactAt ? null : hoursSince(lead.createdAt),
        isTestRecord: isTestRecord({ customerName: lead.customerName, phone: lead.phone }),
      }));

    return { items, total };
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
  periodDays: number;
  totalRequests: number;
  contacted: number;
  quotesSent: number;
  acceptedValue: number;
  newLeads: number;
  uncontacted: number;
  uncontactedOverdue: number;
  quoteFollowUps: number;
  technicalChecks: number;
  /** Open opportunity value. Explicitly NOT revenue — nothing here is closed. */
  pipelineValue: number;
  pipeline: { stage: LeadStage; label: string; count: number; value: number }[];
  /** QA rows excluded from every figure above; shown as a note, not a number. */
  hiddenTestRecords: number;
  actionQueue: LeadListItem[];
  trend: { label: string; requests: number; quotesSent: number }[];
  recentActivities: {
    id: string;
    type: string;
    body: string | null;
    createdAt: Date;
    customerName: string;
  }[];
}

/**
 * Everything the "what do I do today" screen needs, in one pass.
 *
 * `pipelineValue` sums open leads only and is never labelled revenue: it is
 * the value of work in progress, which is a different claim from money earned.
 */
export async function getDashboard(showroomId: string, periodDays = 30): Promise<DashboardViewModel> {
  return withSchemaGuard(async () => {
    const { items: allItems } = await listLeads({ showroomId, take: null });

    // Test rows are excluded from every figure on this screen. A dashboard that
    // counts QA records is a dashboard the partner learns to distrust, and one
    // wrong number is enough to make them doubt the rest.
    const realItems = allItems.filter((l) => !l.isTestRecord);
    const hiddenTestRecords = allItems.length - realItems.length;
    const cutoff = periodDays > 0 ? new Date(Date.now() - periodDays * 86_400_000) : new Date(0);
    const items = realItems.filter((lead) => new Date(lead.createdAt) >= cutoff);

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

    const [quotes, recentActivities] = await Promise.all([
      prisma.quote.findMany({
        where: { showroomId, OR: [{ sentAt: { gte: cutoff } }, { decidedAt: { gte: cutoff } }] },
        select: { status: true, total: true, sentAt: true, decidedAt: true },
      }),
      prisma.leadActivity.findMany({
        where: { showroomId, createdAt: { gte: cutoff } },
        orderBy: { createdAt: 'desc' },
        take: 8,
        select: {
          id: true, type: true, body: true, createdAt: true,
          lead: { select: { customerName: true } },
        },
      }),
    ]);

    const bucketCount = 7;
    const trendStart = periodDays > 0
      ? cutoff.getTime()
      : Math.min(...items.map((lead) => new Date(lead.createdAt).getTime()), Date.now());
    const bucketMs = Math.max((Date.now() - trendStart) / bucketCount, 86_400_000);
    const trend = Array.from({ length: bucketCount }, (_, index) => {
      const start = trendStart + index * bucketMs;
      const end = start + bucketMs;
      const inBucket = items.filter((lead) => {
        const at = new Date(lead.createdAt).getTime();
        return at >= start && at < end;
      });
      return {
        label: new Date(start).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
        requests: inBucket.length,
        quotesSent: quotes.filter((quote) => {
          const at = quote.sentAt?.getTime();
          return at !== undefined && at >= start && at < end;
        }).length,
      };
    });

    return {
      periodDays,
      totalRequests: items.length,
      contacted: items.filter((lead) => lead.firstContactAt !== null).length,
      quotesSent: quotes.filter((quote) => quote.sentAt && quote.sentAt >= cutoff).length,
      acceptedValue: quotes
        .filter((quote) => quote.status === 'ACCEPTED' && quote.decidedAt && quote.decidedAt >= cutoff)
        .reduce((sum, quote) => sum + quote.total, 0),
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
      hiddenTestRecords,
      trend,
      recentActivities: recentActivities.map((activity) => ({
        id: activity.id,
        type: activity.type,
        body: activity.body,
        createdAt: activity.createdAt,
        customerName: activity.lead.customerName,
      })),
    };
  });
}

/**
 * Customers, derived from leads rather than stored separately.
 *
 * LivLab has no Customer table, and inventing one for this screen would create
 * a second identity for people who already exist as leads. Phone is the
 * grouping key because it is the one contact detail a Vietnamese customer
 * reliably gives; email is often blank.
 */
export async function listCustomers(showroomId: string) {
  return withSchemaGuard(async () => {
    const leads = await prisma.quoteLead.findMany({
      where: { showroomId },
      select: {
        id: true, customerName: true, phone: true, email: true, status: true, stage: true,
        estimatedValue: true, createdAt: true, firstContactAt: true,
        quotes: { select: { id: true, code: true, total: true, status: true }, orderBy: { createdAt: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const byKey = new Map<string, {
      key: string; name: string; phone: string | null; email: string | null;
      leadCount: number; openLeads: number; lastActivityAt: Date;
      latestQuoteCode: string | null; latestQuoteTotal: number | null; wonValue: number;
    }>();

    for (const lead of leads) {
      const key = lead.phone?.replace(/\s/g, '') || lead.email || lead.id;
      const stage = resolveStage(lead);
      const existing = byKey.get(key);
      const quote = lead.quotes[0];

      if (existing) {
        existing.leadCount += 1;
        if (isOpenStage(stage)) existing.openLeads += 1;
        if (lead.createdAt > existing.lastActivityAt) existing.lastActivityAt = lead.createdAt;
        if (!existing.latestQuoteCode && quote) {
          existing.latestQuoteCode = quote.code;
          existing.latestQuoteTotal = quote.total;
        }
        // Only an accepted quote counts as won value. A sent quote is a hope.
        if (stage === 'WON') existing.wonValue += quote?.status === 'ACCEPTED' ? quote.total : 0;
      } else {
        byKey.set(key, {
          key, name: lead.customerName, phone: lead.phone, email: lead.email,
          leadCount: 1, openLeads: isOpenStage(stage) ? 1 : 0, lastActivityAt: lead.createdAt,
          latestQuoteCode: quote?.code ?? null, latestQuoteTotal: quote?.total ?? null,
          wonValue: stage === 'WON' && quote?.status === 'ACCEPTED' ? quote.total : 0,
        });
      }
    }

    return [...byKey.values()].sort((a, b) => b.lastActivityAt.getTime() - a.lastActivityAt.getTime());
  });
}

export interface ReportViewModel {
  funnel: { label: string; count: number; rate: number | null }[];
  /** QA rows excluded from every figure here, as on the dashboard. */
  hiddenTestRecords: number;
  medianFirstResponseHours: number | null;
  uncontacted24h: number;
  quotesSent: number;
  quotedValue: number;
  acceptedValue: number;
  quoteWinRate: number | null;
  averageQuoteValue: number | null;
  /** Reasons a figure is unavailable, shown instead of inventing a number. */
  gaps: string[];
}

/**
 * Reports derived only from what the database actually records.
 *
 * Where a figure cannot be derived, it is returned as null and the UI says
 * "chưa đủ dữ liệu". Seeding a plausible number would make the dashboard look
 * finished while telling the showroom something untrue about its own business.
 */
export async function getReports(showroomId: string): Promise<ReportViewModel> {
  return withSchemaGuard(async () => {
    const allLeads = await prisma.quoteLead.findMany({
      where: { showroomId },
      select: {
        id: true, status: true, stage: true, createdAt: true, firstContactAt: true,
        customerName: true, phone: true,
      },
    });
    // Excluded here for the same reason as on the dashboard: a funnel whose
    // top number counts QA rows makes every conversion rate below it wrong,
    // and the two screens must not disagree about how many leads exist.
    const leads = allLeads.filter((l) => !isTestRecord({ customerName: l.customerName, phone: l.phone }));
    const quotes = await prisma.quote.findMany({
      where: { showroomId },
      select: { status: true, total: true, sentAt: true },
    });

    const stages = leads.map((l) => resolveStage(l));
    const total = leads.length;
    const contacted = stages.filter((s) => s !== 'NEW').length;
    const qualified = stages.filter((s) => ['QUALIFIED', 'QUOTING', 'QUOTE_SENT', 'FOLLOW_UP', 'WON'].includes(s)).length;
    const quoted = stages.filter((s) => ['QUOTE_SENT', 'FOLLOW_UP', 'WON'].includes(s)).length;
    const won = stages.filter((s) => s === 'WON').length;

    const rate = (n: number) => (total === 0 ? null : Math.round((n / total) * 100));
    const funnel = [
      { label: 'Lead', count: total, rate: total === 0 ? null : 100 },
      { label: 'Đã liên hệ', count: contacted, rate: rate(contacted) },
      { label: 'Đã xác định nhu cầu', count: qualified, rate: rate(qualified) },
      // Leads that REACHED this stage — not quote documents that were sent.
      // The two are genuinely different and used to be reported under names
      // close enough to read as a contradiction: the funnel said 2 while
      // "Báo giá đã gửi" said 0, because two leads were marked as quoted
      // without a Quote record ever being issued.
      { label: 'Lead tới giai đoạn báo giá', count: quoted, rate: rate(quoted) },
      { label: 'Đã chốt', count: won, rate: rate(won) },
    ];

    // Only leads that were actually contacted can measure response time.
    const responseHours = leads
      .filter((l) => l.firstContactAt)
      .map((l) => (l.firstContactAt!.getTime() - l.createdAt.getTime()) / 3_600_000)
      .sort((a, b) => a - b);
    const medianFirstResponseHours =
      responseHours.length === 0
        ? null
        : Math.round(responseHours[Math.floor(responseHours.length / 2)] * 10) / 10;

    const sent = quotes.filter((q) => q.sentAt);
    const accepted = quotes.filter((q) => q.status === 'ACCEPTED');
    const quotedValue = sent.reduce((s, q) => s + q.total, 0);

    const gaps: string[] = [];
    if (responseHours.length === 0) {
      gaps.push('Chưa có lead nào được ghi nhận thời điểm liên hệ đầu tiên, nên chưa tính được thời gian phản hồi.');
    }
    if (sent.length === 0) {
      gaps.push('Chưa có báo giá nào được gửi, nên chưa tính được tỉ lệ chốt từ báo giá.');
    }

    return {
      funnel,
      hiddenTestRecords: allLeads.length - leads.length,
      medianFirstResponseHours,
      uncontacted24h: leads.filter(
        (l) => !l.firstContactAt && Date.now() - l.createdAt.getTime() > 86_400_000
      ).length,
      quotesSent: sent.length,
      quotedValue,
      acceptedValue: accepted.reduce((s, q) => s + q.total, 0),
      quoteWinRate: sent.length === 0 ? null : Math.round((accepted.length / sent.length) * 100),
      averageQuoteValue: sent.length === 0 ? null : Math.round(quotedValue / sent.length),
      gaps,
    };
  });
}
