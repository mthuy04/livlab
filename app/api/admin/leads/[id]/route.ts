import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const data = await request.json();
    
    const existing = await prisma.quoteLead.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Không tìm thấy lead trong database.' }, { status: 404 });
    }

    const updated = await prisma.quoteLead.update({
      where: { id },
      data
    });
    return NextResponse.json({ lead: updated });
  } catch (error) {
    console.error('Error updating lead:', error);
    return NextResponse.json({ error: 'Lỗi cập nhật database.' }, { status: 500 });
  }
}
