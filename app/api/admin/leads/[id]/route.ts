import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser, hasRole, unauthorized, forbidden } from '@/lib/auth/session';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return unauthorized();
  if (!hasRole(user, 'ADMIN', 'SHOWROOM')) return forbidden();

  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const data = await request.json();

    const existing = await prisma.quoteLead.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Không tìm thấy lead trong database.' }, { status: 404 });
    }

    if (user.role === 'SHOWROOM' && existing.showroomId !== user.showroomId) {
      return forbidden('Lead này không thuộc showroom của bạn.');
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
