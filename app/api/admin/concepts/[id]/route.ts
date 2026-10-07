import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { pickAllowed, isEmptyUpdate, CONCEPT_MUTABLE_FIELDS } from '@/lib/api/mutableFields';
import { getSessionUser, hasRole, unauthorized, forbidden } from '@/lib/auth/session';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return unauthorized();
  if (!hasRole(user, 'ADMIN')) return forbidden();

  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    // Allow-listed: the payload may not choose which columns to write.
    const data = pickAllowed<Prisma.ConceptUpdateInput, typeof CONCEPT_MUTABLE_FIELDS[number]>(await request.json(), CONCEPT_MUTABLE_FIELDS);
    if (isEmptyUpdate(data)) {
      return NextResponse.json({ error: 'Không có trường hợp lệ nào để cập nhật.' }, { status: 400 });
    }
    
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
  const user = await getSessionUser();
  if (!user) return unauthorized();
  if (!hasRole(user, 'ADMIN')) return forbidden();

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
