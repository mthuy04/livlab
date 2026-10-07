import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireShowroomContext, handleShowroomError } from '@/lib/showroom/apiHelpers';
import { pickAllowed, isEmptyUpdate } from '@/lib/api/mutableFields';
import type { Prisma } from '@prisma/client';

/** Commercial profile only. `status` and ownership stay out of reach. */
const PROFILE_FIELDS = ['name', 'contactName', 'email', 'phone', 'address'] as const;

export async function GET() {
  const ctx = await requireShowroomContext();
  if ('error' in ctx) return ctx.error;
  try {
    const showroom = await prisma.showroom.findUnique({ where: { id: ctx.showroomId } });
    if (!showroom) return NextResponse.json({ error: 'Không tìm thấy showroom.' }, { status: 404 });
    return NextResponse.json({ showroom });
  } catch (error) {
    return handleShowroomError(error);
  }
}

export async function PATCH(request: Request) {
  const ctx = await requireShowroomContext();
  if ('error' in ctx) return ctx.error;
  try {
    const data = pickAllowed<Prisma.ShowroomUpdateInput, (typeof PROFILE_FIELDS)[number]>(
      await request.json(),
      PROFILE_FIELDS
    );
    if (isEmptyUpdate(data)) {
      return NextResponse.json({ error: 'Không có trường hợp lệ nào để cập nhật.' }, { status: 400 });
    }
    // Scoped by the session's showroom, never by an id from the payload.
    const showroom = await prisma.showroom.update({ where: { id: ctx.showroomId }, data });
    return NextResponse.json({ showroom });
  } catch (error) {
    return handleShowroomError(error);
  }
}
