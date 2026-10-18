import { NextResponse } from 'next/server';
import { getReports } from '@/lib/showroom/showroomRepository';
import { requireShowroomContext, handleShowroomError } from '@/lib/showroom/apiHelpers';

const cell = (value: unknown) => `"${String(value ?? '').replaceAll('"', '""')}"`;

export async function GET() {
  const ctx = await requireShowroomContext();
  if ('error' in ctx) return ctx.error;
  try {
    const report = await getReports(ctx.showroomId);
    const rows: unknown[][] = [
      ['Chỉ số', 'Giá trị'],
      ['Báo giá đã gửi', report.quotesSent],
      ['Tổng giá trị đã gửi', report.quotedValue],
      ['Giá trị được chấp nhận', report.acceptedValue],
      ['Tỉ lệ khách duyệt (%)', report.quoteWinRate ?? ''],
      ['Giá trị báo giá trung bình', report.averageQuoteValue ?? ''],
      ['Phản hồi trung vị (giờ)', report.medianFirstResponseHours ?? ''],
      ['Chưa liên hệ quá 24 giờ', report.uncontacted24h],
      [],
      ['Giai đoạn phễu', 'Số lead', 'Tỉ lệ (%)'],
      ...report.funnel.map((step) => [step.label, step.count, step.rate ?? '']),
    ];
    const csv = `\uFEFF${rows.map((row) => row.map(cell).join(',')).join('\r\n')}`;
    return new NextResponse(csv, {
      headers: {
        'content-type': 'text/csv; charset=utf-8',
        'content-disposition': 'attachment; filename="tungdang-report.csv"',
        'cache-control': 'no-store',
      },
    });
  } catch (error) {
    return handleShowroomError(error);
  }
}
