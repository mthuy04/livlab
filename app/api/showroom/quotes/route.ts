import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { QuoteStatus } from '@prisma/client';
import { createQuoteFromLead } from '@/lib/showroom/quoteService';
import { withSchemaGuard } from '@/lib/showroom/guards';
import { requireShowroomContext, handleShowroomError } from '@/lib/showroom/apiHelpers';

export async function GET(request: Request) {
  const ctx = await requireShowroomContext();
  if ('error' in ctx) return ctx.error;
  try {
    const status = new URL(request.url).searchParams.get('status');
    const quotes = await withSchemaGuard(() =>
      prisma.quote.findMany({
        where: {
          showroomId: ctx.showroomId,
          ...(status && Object.values(QuoteStatus).includes(status as QuoteStatus)
            ? { status: status as QuoteStatus }
            : {}),
        },
        orderBy: { createdAt: 'desc' },
        include: {
          lead: { select: { id: true, customerName: true } },
          createdBy: { select: { name: true, email: true } },
          _count: { select: { lines: true } },
        },
        take: 100,
      })
    );
    return NextResponse.json({ quotes });
  } catch (error) {
    return handleShowroomError(error);
  }
}

/** Creates a draft from a lead, prefilled with the customer's own selection. */
export async function POST(request: Request) {
  const ctx = await requireShowroomContext();
  if ('error' in ctx) return ctx.error;
  try {
    const body = await request.json();
    if (typeof body?.leadId !== 'string') {
      return NextResponse.json({ error: 'Thiếu lead.' }, { status: 400 });
    }
    const quote = await createQuoteFromLead({
      leadId: body.leadId,
      showroomId: ctx.showroomId,
      createdById: ctx.user.id,
      validUntil: body?.validUntil ? new Date(body.validUntil) : null,
    });
    return NextResponse.json({ quote }, { status: 201 });
  } catch (error) {
    return handleShowroomError(error);
  }
}
