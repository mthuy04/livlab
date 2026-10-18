import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireShowroomContext, handleShowroomError } from '@/lib/showroom/apiHelpers';

const cell = (value: unknown) => `"${String(value ?? '').replaceAll('"', '""')}"`;

export async function GET() {
  const ctx = await requireShowroomContext();
  if ('error' in ctx) return ctx.error;
  try {
    const quotes = await prisma.quote.findMany({
      where: { showroomId: ctx.showroomId }, orderBy: { createdAt: 'desc' },
      select: { code: true, customerNameSnapshot: true, customerPhoneSnapshot: true, status: true, subtotal: true, discount: true, total: true, validUntil: true, sentAt: true, createdAt: true },
    });
    const rows = [
      ['Mã báo giá', 'Khách hàng', 'Điện thoại', 'Trạng thái', 'Tạm tính', 'Giảm giá', 'Tổng', 'Hiệu lực', 'Ngày gửi', 'Ngày tạo'],
      ...quotes.map((quote) => [quote.code, quote.customerNameSnapshot, quote.customerPhoneSnapshot ?? '', quote.status, quote.subtotal, quote.discount, quote.total, quote.validUntil?.toISOString() ?? '', quote.sentAt?.toISOString() ?? '', quote.createdAt.toISOString()]),
    ];
    return new NextResponse(`\uFEFF${rows.map((row) => row.map(cell).join(',')).join('\r\n')}`, { headers: { 'content-type': 'text/csv; charset=utf-8', 'content-disposition': 'attachment; filename="tungdang-quotes.csv"', 'cache-control': 'no-store' } });
  } catch (error) { return handleShowroomError(error); }
}
