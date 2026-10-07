import { NextResponse } from 'next/server';
import { LeadStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getSessionUser, hasRole, unauthorized, forbidden } from '@/lib/auth/session';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return unauthorized();
  if (!hasRole(user, 'ADMIN', 'SHOWROOM')) return forbidden();

  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    // Validated explicitly rather than spread from the body. This is the one
    // PATCH a SHOWROOM user can reach, and the body used to be handed straight
    // to prisma.update — so a caller could set `showroomId` and move the lead
    // into another showroom, passing the ownership check below because that
    // check reads the row as it is BEFORE the write.
    const body = await request.json();
    const data: { status?: LeadStatus; notes?: string } = {};

    if (body?.status !== undefined) {
      if (!Object.values(LeadStatus).includes(body.status)) {
        return NextResponse.json({ error: 'Trạng thái không hợp lệ.' }, { status: 400 });
      }
      data.status = body.status;
    }
    if (body?.notes !== undefined) {
      if (typeof body.notes !== 'string') {
        return NextResponse.json({ error: 'Ghi chú không hợp lệ.' }, { status: 400 });
      }
      data.notes = body.notes;
    }
    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'Không có trường hợp lệ nào để cập nhật.' }, { status: 400 });
    }

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
