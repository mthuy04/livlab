import { NextResponse } from 'next/server';
import { QuoteStatus } from '@prisma/client';
import { normalizePhone, isPlausiblePhone } from '@/lib/contact/normalizePhone';
import { prisma } from '@/lib/prisma';
import { isMissingSchemaError } from '@/lib/showroom/guards';
import { resolveStage } from '@/lib/showroom/leadStage';
import { checkPublicLookupRateLimit } from '@/lib/security/publicLookupRateLimiter';

const PUBLIC_QUOTE_STATUSES: QuoteStatus[] = ['SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED'];

/**
 * POST keeps the phone number out of access logs and browser history. The
 * response is an explicit public projection: no internal notes, activity,
 * assignment, draft lines, or staff identity can leak through an `include`.
 */
export async function POST(request: Request) {
  try {
    const forwarded = request.headers.get('x-forwarded-for');
    const clientKey = (forwarded?.split(',')[0] || request.headers.get('x-real-ip') || 'anonymous').trim();
    const rate = checkPublicLookupRateLimit(clientKey);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: 'Bạn đã thử quá nhiều lần. Vui lòng đợi rồi thử lại.', code: 'RATE_LIMITED' },
        { status: 429, headers: { 'retry-after': String(rate.retryAfterSeconds) } }
      );
    }

    const body = (await request.json()) as { requestCode?: string; phone?: string };
    const requestCode = body.requestCode?.trim().toUpperCase();
    const phone = body.phone?.trim() ?? '';
    if (!requestCode || !/^YC-\d{4}-\d{6}$/.test(requestCode) || !isPlausiblePhone(phone)) {
      return NextResponse.json({ error: 'Thông tin tra cứu không hợp lệ.' }, { status: 400 });
    }

    const lead = await prisma.quoteLead.findFirst({
      where: { requestCode, normalizedPhone: normalizePhone(phone) },
      select: {
        requestCode: true,
        customerName: true,
        roomType: true,
        budgetRange: true,
        conceptName: true,
        estimatedValue: true,
        status: true,
        stage: true,
        createdAt: true,
        items: {
          select: { id: true, productName: true, quantity: true, priceMin: true, priceMax: true },
        },
        quotes: {
          where: { status: { in: PUBLIC_QUOTE_STATUSES } },
          orderBy: { sentAt: 'desc' },
          take: 1,
          select: {
            code: true,
            status: true,
            total: true,
            validUntil: true,
            sentAt: true,
            decidedAt: true,
            lines: {
              orderBy: { sortOrder: 'asc' },
              select: {
                type: true,
                skuSnapshot: true,
                nameSnapshot: true,
                brandSnapshot: true,
                quantity: true,
                unitPrice: true,
                discountAmount: true,
                lineTotal: true,
              },
            },
          },
        },
      },
    });

    // Same response for an unknown code and a wrong phone: callers cannot use
    // this endpoint to confirm that a request code exists.
    if (!lead) return NextResponse.json({ error: 'Không tìm thấy yêu cầu.' }, { status: 404 });

    const quote = lead.quotes[0] ?? null;
    return NextResponse.json(
      {
        request: {
          code: lead.requestCode,
          customerName: lead.customerName,
          roomType: lead.roomType,
          budgetRange: lead.budgetRange,
          conceptName: lead.conceptName,
          estimatedValue: lead.estimatedValue,
          stage: resolveStage(lead),
          createdAt: lead.createdAt,
          items: lead.items,
        },
        quote,
      },
      { headers: { 'cache-control': 'no-store, private' } }
    );
  } catch (error) {
    if (isMissingSchemaError(error)) {
      return NextResponse.json(
        { error: 'Hệ thống tra cứu đang được nâng cấp.', code: 'MIGRATION_PENDING' },
        { status: 503 }
      );
    }
    console.error('[quote.lookup] unexpected error', error);
    return NextResponse.json({ error: 'Chưa thể tra cứu lúc này.' }, { status: 500 });
  }
}
