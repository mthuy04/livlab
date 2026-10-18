import { randomUUID } from 'node:crypto';
import { BudgetFitStatus, LeadRequestType, Prisma } from '@prisma/client';
import { getBudgetFit } from '@/lib/budget/getBudgetFit';
import { normalizePhone, isPlausiblePhone } from '@/lib/contact/normalizePhone';
import { prisma } from '@/lib/prisma';
import { getCatalog } from '@/lib/storefront/catalog';
import type { TenantStorefrontConfig } from '@/lib/storefront/tenantConfig';

export class PublicQuoteError extends Error {
  constructor(message: string, public status = 400, public code = 'INVALID_REQUEST') {
    super(message);
    this.name = 'PublicQuoteError';
  }
}

interface IncomingLine {
  id?: string;
  productId?: string;
  catalogProductId?: string;
  sourceType?: string;
  sku?: string;
  name?: string;
  brand?: string;
  category?: string;
  quantity?: number;
  price?: number;
  priceMin?: number;
  priceMax?: number;
  priceSnapshot?: number | null;
  sourceContext?: string;
}

export interface PublicQuoteBody {
  customerName?: string;
  phone?: string;
  email?: string | null;
  roomType?: string | null;
  budgetRange?: string | null;
  budgetMin?: number | string | null;
  budgetMax?: number | string | null;
  conceptName?: string | null;
  notes?: string | null;
  requestType?: string | null;
  context?: unknown;
  items?: IncomingLine[];
  aiSummary?: string | null;
  aiFitScore?: number | null;
  aiSource?: string | null;
  aiLog?: { input?: unknown; output?: unknown } | null;
  submissionKey?: string | null;
}

function integerOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const number = Math.round(Number(value));
  return Number.isFinite(number) && number >= 0 ? number : null;
}

async function resolveRequestWorkspace(tenant: TenantStorefrontConfig) {
  const mapping = tenant.requestWorkspace;
  if (!mapping) return null;

  const showroom = await prisma.showroom.findUnique({
    where: { id: mapping.showroomId },
    select: { id: true, tenantKey: true, workspaceKind: true },
  });
  if (
    !showroom ||
    showroom.workspaceKind !== mapping.kind ||
    (mapping.kind === 'DEMO' && showroom.tenantKey !== tenant.id)
  ) {
    throw new PublicQuoteError(
      'Workspace tiếp nhận yêu cầu chưa được cấu hình.',
      503,
      'REQUEST_WORKSPACE_UNAVAILABLE'
    );
  }
  if (tenant.publicDemo && showroom.workspaceKind !== 'DEMO') {
    throw new PublicQuoteError('Demo không thể ghi vào workspace live.', 503, 'WORKSPACE_MODE_MISMATCH');
  }
  if (!tenant.publicDemo && mapping.kind === 'DEMO') {
    throw new PublicQuoteError('Storefront live không thể ghi vào workspace demo.', 503, 'WORKSPACE_MODE_MISMATCH');
  }
  return showroom;
}

function requestType(value: unknown): LeadRequestType | null {
  return typeof value === 'string' && Object.values(LeadRequestType).includes(value as LeadRequestType)
    ? (value as LeadRequestType)
    : LeadRequestType.QUOTATION;
}

/** Serialised inside the lead transaction, so concurrent requests cannot share a code. */
async function nextRequestCode(tx: Prisma.TransactionClient): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `YC-${year}-`;
  await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${`livlab:${prefix}`}))`;
  const last = await tx.quoteLead.findFirst({
    where: { requestCode: { startsWith: prefix } },
    orderBy: { requestCode: 'desc' },
    select: { requestCode: true },
  });
  const current = last?.requestCode ? Number.parseInt(last.requestCode.slice(prefix.length), 10) : 0;
  return `${prefix}${String((Number.isFinite(current) ? current : 0) + 1).padStart(6, '0')}`;
}

export async function createPublicQuoteRequest(
  tenant: TenantStorefrontConfig,
  body: PublicQuoteBody,
  idempotencyKey?: string | null
) {
  const customerName = body.customerName?.trim();
  const phone = body.phone?.trim();
  if (!customerName || customerName.length > 160) {
    throw new PublicQuoteError('Vui lòng nhập họ và tên hợp lệ.');
  }
  if (!phone || !isPlausiblePhone(phone)) {
    throw new PublicQuoteError('Vui lòng nhập số điện thoại hợp lệ.');
  }

  const normalizedPhone = normalizePhone(phone);
  const submissionKey = (idempotencyKey || body.submissionKey || randomUUID()).trim().slice(0, 120);
  const prior = await prisma.quoteLead.findUnique({
    where: { submissionKey },
    select: { id: true, requestCode: true, sourceTenantId: true },
  });
  if (prior) {
    if (prior.sourceTenantId !== tenant.id) {
      throw new PublicQuoteError('Khoá gửi yêu cầu không hợp lệ.', 409, 'IDEMPOTENCY_CONFLICT');
    }
    return { id: prior.id, requestCode: prior.requestCode, duplicate: true };
  }

  const workspace = await resolveRequestWorkspace(tenant);
  const catalog = await getCatalog(tenant, { includeUnpresentable: true });
  const canonicalById = new Map(
    catalog.products.flatMap((product) => [
      [product.id, product] as const,
      [product.catalogProductId, product] as const,
    ])
  );
  const incoming = Array.isArray(body.items) ? body.items.slice(0, 100) : [];
  let estimatedValue = 0;
  const contextLines: Record<string, unknown>[] = [];
  const items = incoming.map((line) => {
    const key = line.catalogProductId || line.productId || line.id || '';
    const product = canonicalById.get(key) ?? canonicalById.get(line.productId || line.id || '');
    const quantity = Math.min(99, Math.max(1, Math.round(Number(line.quantity) || 1)));
    const price = product?.showroomPrice ?? product?.referencePrice ?? 0;
    const fallbackMin = integerOrNull(line.priceMin ?? line.priceSnapshot ?? line.price);
    const fallbackMax = integerOrNull(line.priceMax ?? line.priceSnapshot ?? line.price);
    const priceMin = product ? price : fallbackMin;
    const priceMax = product ? (product.referencePrice ?? price) : fallbackMax;
    estimatedValue += (priceMin ?? 0) * quantity;

    const catalogProductId = (product?.catalogProductId ?? line.catalogProductId ?? key) || null;
    contextLines.push({
      catalogProductId,
      sourceType: product?.sourceType ?? line.sourceType ?? null,
      sku: product?.sku ?? line.sku ?? null,
      priceSnapshot: priceMin,
      sourceContext: line.sourceContext ?? null,
      quantity,
    });

    return {
      productId: product?.sourceType === 'DATABASE' ? product.id : null,
      productName: product?.name ?? line.name?.trim() ?? 'Sản phẩm',
      quantity,
      priceMin,
      priceMax,
    };
  });

  const budgetMin = integerOrNull(body.budgetMin);
  const budgetMax = integerOrNull(body.budgetMax);
  const fit = getBudgetFit({ total: estimatedValue, budgetMin, budgetMax });
  const suppliedContext = body.context && typeof body.context === 'object' ? body.context : {};
  const contextJson = {
    ...(suppliedContext as Record<string, Prisma.InputJsonValue>),
    version: 3,
    source: 'PUBLIC_STOREFRONT',
    tenantId: tenant.id,
    workspaceKind: workspace?.workspaceKind ?? null,
    catalogLines: contextLines,
  } as Prisma.InputJsonValue;

  try {
    return await prisma.$transaction(async (tx) => {
      const duplicate = await tx.quoteLead.findUnique({
        where: { submissionKey },
        select: { id: true, requestCode: true, sourceTenantId: true },
      });
      if (duplicate) {
        if (duplicate.sourceTenantId !== tenant.id) {
          throw new PublicQuoteError('Khoá gửi yêu cầu không hợp lệ.', 409, 'IDEMPOTENCY_CONFLICT');
        }
        return { id: duplicate.id, requestCode: duplicate.requestCode, duplicate: true };
      }

      const requestCode = await nextRequestCode(tx);
      const lead = await tx.quoteLead.create({
        data: {
          requestCode,
          normalizedPhone,
          sourceTenantId: tenant.id,
          submissionKey,
          customerName,
          phone,
          email: body.email?.trim() || null,
          roomType: body.roomType?.trim() || null,
          budgetRange: body.budgetRange?.trim() || null,
          budgetMin,
          budgetMax,
          budgetFit: fit.status as BudgetFitStatus,
          conceptName: body.conceptName?.trim() || null,
          estimatedValue,
          notes: body.notes?.trim() || null,
          consent: true,
          showroomId: workspace?.id ?? null,
          requestType: requestType(body.requestType),
          contextJson,
          aiSummary: body.aiSummary?.trim() || null,
          aiFitScore: integerOrNull(body.aiFitScore),
          aiSource: body.aiSource?.trim() || null,
          items: { create: items },
        },
        select: { id: true, requestCode: true },
      });

      if (body.aiLog?.input !== undefined && body.aiLog?.output !== undefined) {
        await tx.aiSuggestionLog.create({
          data: {
            inputJson: body.aiLog.input as Prisma.InputJsonValue,
            outputJson: body.aiLog.output as Prisma.InputJsonValue,
            source: body.aiSource?.trim() || 'UNKNOWN',
            quoteLeadId: lead.id,
          },
        });
      }
      return { ...lead, duplicate: false };
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const duplicate = await prisma.quoteLead.findUnique({
        where: { submissionKey },
        select: { id: true, requestCode: true, sourceTenantId: true },
      });
      if (duplicate?.sourceTenantId === tenant.id) {
        return { id: duplicate.id, requestCode: duplicate.requestCode, duplicate: true };
      }
    }
    throw error;
  }
}
