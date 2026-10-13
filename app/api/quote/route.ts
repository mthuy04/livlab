import { NextResponse } from 'next/server';
import { PrismaClient, BudgetFitStatus, LeadRequestType, Prisma } from '@prisma/client';
import { getBudgetFit } from '@/lib/budget/getBudgetFit';
import { resolveTenant } from '@/lib/storefront/resolveTenant';

const prisma = new PrismaClient();

/**
 * The lead's context blob.
 *
 * Carries whatever the caller sent, plus the storefront the request came
 * through and the canonical identity of every catalogue line. Lines that
 * cannot be joined to a Product row — demo fixture products — would otherwise
 * arrive as a name and nothing else.
 */
interface IncomingLine {
  catalogProductId?: string;
  sourceType?: string;
  sku?: string;
  priceSnapshot?: number | null;
  sourceContext?: string;
  quantity?: number;
}

function buildContext(
  body: { items?: IncomingLine[]; context?: unknown },
  tenantId: string
): Prisma.InputJsonValue | null {
  const lines = (body.items || [])
    .filter((item) => item?.catalogProductId)
    .map((item) => ({
      catalogProductId: item.catalogProductId,
      sourceType: item.sourceType ?? null,
      sku: item.sku ?? null,
      priceSnapshot: item.priceSnapshot ?? null,
      sourceContext: item.sourceContext ?? null,
      quantity: item.quantity ?? 1,
    }));

  if (!body.context && lines.length === 0) return null;
  return {
    ...(body.context && typeof body.context === 'object' ? body.context : {}),
    tenantId,
    ...(lines.length > 0 ? { catalogLines: lines } : {}),
  } as Prisma.InputJsonValue;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Who owns this lead is decided here, from the storefront the request
    // came through — never from the payload. A client that could name its own
    // showroom could route another showroom's customer to itself.
    // A tenant with no showroom of its own is an internal demo configuration.
    // It used to fall through to `findFirst()`, which attached every demo lead
    // to whichever showroom happened to be first in the table — a real
    // showroom receiving a request from a storefront that is not theirs. The
    // lead is kept unassigned instead, with the storefront recorded in its
    // context.
    const tenant = await resolveTenant();
    const showroom = tenant.catalogScope.showroomId
      ? await prisma.showroom.findUnique({ where: { id: tenant.catalogScope.showroomId } })
      : null;
    
    // Fetch real products from DB to calculate real price
    const productIds = (body.items || []).map((item: any) => item.productId || item.id).filter(Boolean);
    const dbProducts = await prisma.product.findMany({
      where: { id: { in: productIds } }
    });

    let realEstimatedValue = 0;

    // Process items safely and calculate real total
    const itemsData = (body.items || []).map((item: any) => {
      const pid = item.productId || item.id;
      const dbProd = dbProducts.find(p => p.id === pid);
      
      const realPriceMin = dbProd?.priceMin || item.priceMin || item.price || 0;
      const realPriceMax = dbProd?.priceMax || item.priceMax || item.price || 0;
      const quantity = item.quantity || 1;

      realEstimatedValue += realPriceMin * quantity; // Or average, using Min for estimation

      return {
        // QuoteItem.productId is a foreign key onto Product. A demo-fixture
        // product has no Product row, and sending its catalogue id here fails
        // the insert and loses the whole request — so the column is only
        // filled when the row really exists, and the line keeps its identity
        // through the name and the lead's context payload.
        productId: dbProd ? pid : null,
        productName: dbProd?.name || item.name || 'Sản phẩm',
        quantity: quantity,
        priceMin: realPriceMin,
        priceMax: realPriceMax,
      };
    });

    const budgetMin = body.budgetMin ? parseInt(body.budgetMin) : null;
    const budgetMax = body.budgetMax ? parseInt(body.budgetMax) : null;
    
    const budgetFitResult = getBudgetFit({
      total: realEstimatedValue,
      budgetMin,
      budgetMax
    });

    // Validated against the enum rather than trusted: this endpoint is public,
    // and an unknown value would fail the insert and lose the whole request.
    const requestType =
      typeof body.requestType === 'string' &&
      Object.values(LeadRequestType).includes(body.requestType as LeadRequestType)
        ? (body.requestType as LeadRequestType)
        : null;

    const lead = await prisma.quoteLead.create({
      data: {
        customerName: body.customerName || 'Khách hàng ẩn danh',
        email: body.email || null,
        phone: body.phone || null,
        roomType: body.roomType || null,
        budgetRange: body.budgetRange || null,
        budgetMin: budgetMin,
        budgetMax: budgetMax,
        budgetFit: budgetFitResult.status as BudgetFitStatus,
        conceptName: body.conceptName || null,
        estimatedValue: realEstimatedValue,
        notes: body.notes || null,
        showroomId: showroom?.id || null,
        aiSummary: body.aiSummary || null,
        aiFitScore: body.aiFitScore || null,
        aiSource: body.aiSource || null,
        requestType,
        // Stored as sent. Old leads keep a null context; nothing is backfilled,
        // and the prose in `notes` is never parsed into this column.
        contextJson: buildContext(body, tenant.id) ?? Prisma.DbNull,
        items: {
          create: itemsData
        }
      }
    });

    // If there's an aiLog payload, we can save it too
    if (body.aiLog) {
      await prisma.aiSuggestionLog.create({
        data: {
          inputJson: body.aiLog.input,
          outputJson: body.aiLog.output,
          source: body.aiSource || 'UNKNOWN',
          quoteLeadId: lead.id
        }
      });
    }

    return NextResponse.json({ success: true, lead });
  } catch (error: any) {
    console.error('Error creating quote lead:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
