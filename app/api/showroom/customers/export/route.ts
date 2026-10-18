import { NextResponse } from 'next/server';
import { listCustomers } from '@/lib/showroom/showroomRepository';
import { requireShowroomContext, handleShowroomError } from '@/lib/showroom/apiHelpers';

const cell = (value: unknown) => `"${String(value ?? '').replaceAll('"', '""')}"`;

export async function GET() {
  const ctx = await requireShowroomContext();
  if ('error' in ctx) return ctx.error;
  try {
    const customers = await listCustomers(ctx.showroomId);
    const rows = [['Khách hàng', 'Điện thoại', 'Email', 'Số yêu cầu', 'Yêu cầu đang mở', 'Báo giá gần nhất', 'Giá trị báo giá', 'Giá trị đã duyệt'], ...customers.map((customer) => [customer.name, customer.phone ?? '', customer.email ?? '', customer.leadCount, customer.openLeads, customer.latestQuoteCode ?? '', customer.latestQuoteTotal ?? '', customer.wonValue])];
    return new NextResponse(`\uFEFF${rows.map((row) => row.map(cell).join(',')).join('\r\n')}`, { headers: { 'content-type': 'text/csv; charset=utf-8', 'content-disposition': 'attachment; filename="tungdang-customers.csv"', 'cache-control': 'no-store' } });
  } catch (error) { return handleShowroomError(error); }
}
