import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';

export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  showroomId: string | null;
}

// Cookie only stores `id` (and a stale copy of role/etc.) — role and showroomId are
// re-read from the DB on every call since the cookie lives 1 week and an admin can
// change a user's role/showroom assignment at any time.
export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('livlab_session');

  if (!sessionCookie || !sessionCookie.value) {
    return null;
  }

  try {
    const sessionData = JSON.parse(Buffer.from(sessionCookie.value, 'base64').toString('utf-8'));
    if (!sessionData?.id) {
      return null;
    }

    const user = await prisma.user.findUnique({
      where: { id: sessionData.id },
      select: { id: true, email: true, name: true, role: true, showroomId: true },
    });

    return user;
  } catch (error) {
    console.error('Session decode error:', error);
    return null;
  }
}

export function hasRole(user: SessionUser | null, ...roles: UserRole[]): boolean {
  if (!user) return false;
  return roles.includes(user.role);
}

export function unauthorized(message = 'Bạn cần đăng nhập để thực hiện thao tác này.') {
  return NextResponse.json({ error: message }, { status: 401 });
}

export function forbidden(message = 'Bạn không có quyền thực hiện thao tác này.') {
  return NextResponse.json({ error: message }, { status: 403 });
}

// ADMIN sees everything. SHOWROOM is scoped to their own showroomId — if they
// haven't been assigned one yet, scope to a string no real row has so they see
// zero results instead of silently falling through to "see all".
export function showroomScopeFilter(user: SessionUser): { showroomId?: string } {
  if (user.role === 'ADMIN') return {};
  return { showroomId: user.showroomId ?? '__unassigned__' };
}
