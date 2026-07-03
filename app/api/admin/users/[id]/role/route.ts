import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { getSessionUser, hasRole, unauthorized, forbidden } from '@/lib/auth/session';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return unauthorized();
  if (!hasRole(sessionUser, 'ADMIN')) return forbidden();

  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const body = await request.json();
    const { role, showroomId } = body;

    if (!role || !Object.values(UserRole).includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // A demoted-then-repromoted account should never inherit a stale showroom assignment.
    const data: { role: UserRole; showroomId?: string | null } = { role };
    if (role !== 'SHOWROOM') {
      data.showroomId = null;
    } else if ('showroomId' in body) {
      data.showroomId = showroomId || null;
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, role: true, showroomId: true }
    });

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error('Error updating user role:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
