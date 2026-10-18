import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { resolveStage, STAGE_LABEL } from '@/lib/showroom/leadStage';
import { requireShowroomContext, handleShowroomError } from '@/lib/showroom/apiHelpers';

const csvCell = (value: unknown) => `"${String(value ?? '').replaceAll('"', '""')}"`;

export async function GET() {
  const ctx = await requireShowroomContext();
  if ('error' in ctx) return ctx.error;
  try {
    const leads = await prisma.quoteLead.findMany({
      where: { showroomId: ctx.showroomId },
      orderBy: { createdAt: 'desc' },
      select: {
        requestCode: true, customerName: true, phone: true, conceptName: true,
        roomType: true, budgetMin: true, budgetMax: true, estimatedValue: true,
        status: true, stage: true, createdAt: true,
      },
    });
    const rows = [
      ['Mã yêu cầu', 'Tên khách hàng', 'Số điện thoại', 'Concept', 'Loại phòng', 'Ngân sách tối thiểu', 'Ngân sách tối đa', 'Giá trị tham khảo', 'Giai đoạn', 'Ngày tạo'],
      ...leads.map((lead) => [
        lead.requestCode ?? '', lead.customerName, lead.phone ?? '', lead.conceptName ?? '',
        lead.roomType ?? '', lead.budgetMin ?? '', lead.budgetMax ?? '', lead.estimatedValue ?? '',
        STAGE_LABEL[resolveStage(lead)], lead.createdAt.toISOString(),
      ]),
    ];
    const csv = `\uFEFF${rows.map((row) => row.map(csvCell).join(',')).join('\r\n')}`;
    return new NextResponse(csv, {
      headers: {
        'content-type': 'text/csv; charset=utf-8',
        'content-disposition': 'attachment; filename="tungdang-leads.csv"',
        'cache-control': 'no-store',
      },
    });
  } catch (error) {
    return handleShowroomError(error);
  }
}
