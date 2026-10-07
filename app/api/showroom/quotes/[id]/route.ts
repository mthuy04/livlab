import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { QuoteStatus } from '@prisma/client';
import { updateQuoteLines, changeQuoteStatus } from '@/lib/showroom/quoteService';
import { withSchemaGuard } from '@/lib/showroom/guards';
import { requireShowroomContext, handleShowroomError } from '@/lib/showroom/apiHelpers';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireShowroomContext();
  if ('error' in ctx) return ctx.error;
  try {
    const { id } = await params;
    const quote = await withSchemaGuard(() =>
      prisma.quote.findFirst({
        where: { id, showroomId: ctx.showroomId },
        include: {
          lines: { orderBy: { sortOrder: 'asc' } },
          lead: { select: { id: true, customerName: true, phone: true } },
        },
      })
    );
    if (!quote) return NextResponse.json({ error: 'Không tìm thấy báo giá.' }, { status: 404 });
    return NextResponse.json({ quote });
  } catch (error) {
    return handleShowroomError(error);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireShowroomContext();
  if ('error' in ctx) return ctx.error;
  try {
    const { id } = await params;
    const body = await request.json();

    if (Array.isArray(body?.lines)) {
      // Totals are recomputed from the lines by the service; any totals in the
      // payload are ignored rather than trusted.
      const quote = await updateQuoteLines({
        quoteId: id,
        showroomId: ctx.showroomId,
        lines: body.lines,
      });
      return NextResponse.json({ quote });
    }

    if (body?.status !== undefined) {
      if (!Object.values(QuoteStatus).includes(body.status)) {
        return NextResponse.json({ error: 'Trạng thái không hợp lệ.' }, { status: 400 });
      }
      const quote = await changeQuoteStatus({
        quoteId: id,
        showroomId: ctx.showroomId,
        to: body.status,
        createdById: ctx.user.id,
      });
      return NextResponse.json({ quote });
    }

    return NextResponse.json({ error: 'Không có thay đổi hợp lệ.' }, { status: 400 });
  } catch (error) {
    return handleShowroomError(error);
  }
}
