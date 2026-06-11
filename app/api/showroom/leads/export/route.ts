import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { LeadStatus } from '@prisma/client';

const statusMap: Record<string, string> = {
  NEW: 'Mới',
  CONTACTED: 'Đã liên hệ',
  QUOTED: 'Đã báo giá',
  WON: 'Đã chốt',
  LOST: 'Mất lead'
};

export async function GET() {
  try {
    const leads = await prisma.quoteLead.findMany({
      include: {
        items: true,
      },
      orderBy: { createdAt: 'desc' }
    });

    const csvRows = [
      ['Mã Lead', 'Tên khách hàng', 'Số điện thoại', 'Concept', 'Loại phòng', 'Ngân sách tối thiểu', 'Ngân sách tối đa', 'Trạng thái', 'Ngày tạo']
    ];

    for (const l of leads) {
      const code = l.id.slice(-6).toUpperCase();
      const name = `"${l.customerName.replace(/"/g, '""')}"`;
      const phone = `"${(l.phone || '').replace(/"/g, '""')}"`;
      const concept = `"${(l.conceptName || '').replace(/"/g, '""')}"`;
      const room = `"${(l.roomType || '').replace(/"/g, '""')}"`;
      const valMin = l.estimatedValue || 0;
      const valMax = l.estimatedValue || 0;
      const status = statusMap[l.status] || 'Mới';
      const date = l.createdAt.toISOString();
      csvRows.push([code, name, phone, concept, room, valMin.toString(), valMax.toString(), status, date]);
    }

    const csvString = '\uFEFF' + csvRows.map(row => row.join(',')).join('\n'); // Add BOM

    return new NextResponse(csvString, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="livlab-leads-export.csv"'
      }
    });
  } catch (error) {
    console.error('Error exporting leads:', error);
    return NextResponse.json({ error: 'Lỗi khi export CSV' }, { status: 500 });
  }
}
