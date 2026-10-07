import { Prisma, type QuoteStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireOwnedLead, withSchemaGuard, ShowroomAccessError } from './guards';

/**
 * Quotations the showroom issues.
 *
 * A quote is a historical commercial document, so every value that gives it
 * meaning is copied in at creation: the line items AND who it was for. It then
 * stops depending on the catalogue or the lead, both of which keep changing.
 */

export interface QuoteLineInput {
  type?: 'PRODUCT' | 'SERVICE';
  productId?: string | null;
  skuSnapshot?: string | null;
  nameSnapshot: string;
  brandSnapshot?: string | null;
  description?: string | null;
  quantity: number;
  referencePriceSnapshot?: number | null;
  unitPrice: number;
  discountAmount?: number;
}

/** Totals are derived here, never trusted from the client. */
function priceLines(lines: QuoteLineInput[]) {
  const priced = lines.map((line, index) => {
    const quantity = Math.max(1, Math.round(line.quantity || 1));
    const unitPrice = Math.max(0, Math.round(line.unitPrice || 0));
    const discountAmount = Math.max(0, Math.round(line.discountAmount || 0));
    // Clamped at zero: a discount larger than the line must not turn into a
    // negative that quietly subtracts from the rest of the quote.
    const lineTotal = Math.max(0, quantity * unitPrice - discountAmount);
    return {
      type: line.type ?? 'PRODUCT',
      productId: line.productId ?? null,
      skuSnapshot: line.skuSnapshot ?? null,
      nameSnapshot: line.nameSnapshot,
      brandSnapshot: line.brandSnapshot ?? null,
      description: line.description ?? null,
      quantity,
      referencePriceSnapshot: line.referencePriceSnapshot ?? null,
      unitPrice,
      discountAmount,
      lineTotal,
      sortOrder: index,
    };
  });

  const subtotal = priced.reduce((sum, l) => sum + l.quantity * l.unitPrice, 0);
  const discount = priced.reduce((sum, l) => sum + l.discountAmount, 0);
  return { priced, subtotal, discount, total: Math.max(0, subtotal - discount) };
}

/** Next human reference in the BG-YYYY-NNNN series, scoped to the year. */
async function nextQuoteCode(tx: Prisma.TransactionClient): Promise<string> {
  const prefix = `BG-${new Date().getFullYear()}-`;
  const last = await tx.quote.findFirst({
    where: { code: { startsWith: prefix } },
    orderBy: { code: 'desc' },
    select: { code: true },
  });
  const n = last ? Number.parseInt(last.code.slice(prefix.length), 10) : 0;
  return `${prefix}${String((Number.isFinite(n) ? n : 0) + 1).padStart(4, '0')}`;
}

/**
 * Creates a quote from a lead, prefilled with what the customer already chose
 * in LivLab — the showroom should never retype that selection.
 *
 * Showroom prices default to the showroom's own offer where one exists, then
 * to LivLab's reference price. Nothing is invented: a product with no price
 * anywhere starts at 0 for a human to fill in.
 */
export async function createQuoteFromLead(params: {
  leadId: string;
  showroomId: string;
  createdById?: string | null;
  validUntil?: Date | null;
  notes?: string | null;
}) {
  const { leadId, showroomId, createdById } = params;

  return withSchemaGuard(async () => {
    const lead = await requireOwnedLead(leadId, showroomId);

    const items = await prisma.quoteItem.findMany({
      where: { leadId },
      include: { product: true },
    });

    const offers = await prisma.showroomProductOffer.findMany({
      where: {
        showroomId,
        productId: { in: items.map((i) => i.productId).filter((id): id is string => Boolean(id)) },
      },
    });
    const offerByProduct = new Map(offers.map((o) => [o.productId, o]));

    const lines: QuoteLineInput[] = items.map((item) => {
      const offer = item.productId ? offerByProduct.get(item.productId) : undefined;
      const reference = item.priceMin ?? item.product?.priceMin ?? null;
      return {
        type: 'PRODUCT',
        productId: item.productId,
        skuSnapshot: item.product?.slug ?? null,
        nameSnapshot: item.productName,
        brandSnapshot: item.product?.brand ?? null,
        quantity: item.quantity,
        referencePriceSnapshot: reference,
        unitPrice: offer?.promotionPrice ?? offer?.showroomPrice ?? reference ?? 0,
      };
    });

    const { priced, subtotal, discount, total } = priceLines(lines);

    return prisma.$transaction(async (tx) => {
      const code = await nextQuoteCode(tx);
      return tx.quote.create({
        data: {
          code,
          leadId,
          showroomId,
          status: 'DRAFT',
          // Recipient snapshot: the quote must still say who it was for after
          // the lead changes or is deleted.
          customerNameSnapshot: lead.customerName,
          customerPhoneSnapshot: lead.phone,
          customerEmailSnapshot: lead.email,
          subtotal,
          discount,
          total,
          validUntil: params.validUntil ?? null,
          notes: params.notes ?? null,
          createdById: createdById ?? null,
          lines: { create: priced },
        },
        include: { lines: { orderBy: { sortOrder: 'asc' } } },
      });
    });
  });
}

/** Replaces a draft's lines and recomputes its totals. */
export async function updateQuoteLines(params: {
  quoteId: string;
  showroomId: string;
  lines: QuoteLineInput[];
}) {
  const { quoteId, showroomId, lines } = params;

  return withSchemaGuard(async () => {
    const quote = await prisma.quote.findUnique({ where: { id: quoteId } });
    if (!quote || quote.showroomId !== showroomId) {
      throw new ShowroomAccessError('Không tìm thấy báo giá của showroom này.');
    }
    if (quote.status !== 'DRAFT') {
      throw new ShowroomAccessError('Chỉ có thể sửa báo giá ở trạng thái nháp.');
    }

    const { priced, subtotal, discount, total } = priceLines(lines);

    return prisma.$transaction(async (tx) => {
      await tx.quoteLine.deleteMany({ where: { quoteId } });
      return tx.quote.update({
        where: { id: quoteId },
        data: { subtotal, discount, total, lines: { create: priced } },
        include: { lines: { orderBy: { sortOrder: 'asc' } } },
      });
    });
  });
}

/** Legal status moves. Anything not listed is rejected rather than silently applied. */
const ALLOWED_TRANSITIONS: Record<QuoteStatus, QuoteStatus[]> = {
  DRAFT: ['SENT'],
  SENT: ['ACCEPTED', 'REJECTED', 'EXPIRED'],
  ACCEPTED: [],
  REJECTED: [],
  EXPIRED: ['SENT'],
};

export async function changeQuoteStatus(params: {
  quoteId: string;
  showroomId: string;
  to: QuoteStatus;
  createdById?: string | null;
}) {
  const { quoteId, showroomId, to, createdById } = params;

  return withSchemaGuard(async () => {
    const quote = await prisma.quote.findUnique({ where: { id: quoteId } });
    if (!quote || quote.showroomId !== showroomId) {
      throw new ShowroomAccessError('Không tìm thấy báo giá của showroom này.');
    }
    if (!ALLOWED_TRANSITIONS[quote.status].includes(to)) {
      throw new ShowroomAccessError(`Không thể chuyển báo giá từ ${quote.status} sang ${to}.`);
    }

    const now = new Date();
    return prisma.$transaction(async (tx) => {
      const updated = await tx.quote.update({
        where: { id: quoteId },
        data: {
          status: to,
          sentAt: to === 'SENT' ? now : quote.sentAt,
          decidedAt: to === 'ACCEPTED' || to === 'REJECTED' ? now : quote.decidedAt,
        },
      });

      // Sending a quote is part of the lead's story, so it lands on the timeline.
      if (to === 'SENT' && quote.leadId) {
        await tx.leadActivity.create({
          data: {
            leadId: quote.leadId,
            showroomId,
            type: 'QUOTE_SENT',
            body: `Đã gửi báo giá ${quote.code}`,
            metadataJson: { quoteId, code: quote.code, total: quote.total },
            doneAt: now,
            createdById: createdById ?? null,
          },
        });
      }

      return updated;
    });
  });
}
