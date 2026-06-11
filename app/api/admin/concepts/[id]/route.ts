import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const data = await request.json();
    
    const existing = await prisma.concept.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Không tìm thấy concept trong database.' }, { status: 404 });
    }

    const updated = await prisma.concept.update({
      where: { id },
      data
    });
    return NextResponse.json({ concept: updated });
  } catch (error) {
    console.error('Error updating concept:', error);
    return NextResponse.json({ error: 'Lỗi cập nhật database.' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    
    const existing = await prisma.concept.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Không tìm thấy concept trong database.' }, { status: 404 });
    }

    await prisma.concept.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting concept:', error);
    return NextResponse.json({ error: 'Lỗi xoá dữ liệu database.' }, { status: 500 });
  }
}
