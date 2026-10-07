import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { SESSION_COOKIE, verifySession } from '@/lib/auth/sessionToken';

export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  showroomId: string | null;
}

// The cookie is verified, then used only for its `id`. Role and showroomId are
// re-read from the DB on every call: the cookie lives a week and an admin can
// change a user's role or showroom assignment at any point inside it.
//
// Verification is what makes the id trustworthy. Before signing existed, any
// id placed in a cookie was accepted, so this lookup would happily return the
// admin to a stranger who wrote one.
export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  const session = await verifySession(token);
  if (!session) {
    return null;
  }

  return prisma.user.findUnique({
    where: { id: session.id },
    select: { id: true, email: true, name: true, role: true, showroomId: true },
  });
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
//
// Callers should reject unassigned accounts with showroomUnassigned() BEFORE
// querying; this sentinel is the last line of defence, not the explanation.
export function showroomScopeFilter(user: SessionUser): { showroomId?: string } {
  if (user.role === 'ADMIN') return {};
  return { showroomId: user.showroomId ?? '__unassigned__' };
}

/**
 * Guards the gap between "is a SHOWROOM" and "administers a showroom".
 *
 * Registration can create a SHOWROOM account without assigning a showroom, and
 * until an admin assigns one every scoped query legitimately matches nothing.
 * Returning those empty results was indistinguishable from "your showroom has
 * no leads yet", so the portal looked broken rather than unconfigured — the
 * actual cause of the showroom login reports.
 *
 * 409 rather than 403: the credentials are valid and the role is right. What
 * is missing is configuration only an admin can supply.
 */
export function showroomUnassigned(user: SessionUser): NextResponse | null {
  if (user.role !== 'SHOWROOM' || user.showroomId) return null;
  return NextResponse.json(
    {
      error:
        'Tài khoản của bạn chưa được gán showroom. Vui lòng liên hệ LivLab để được cấp quyền truy cập showroom.',
      code: 'SHOWROOM_UNASSIGNED',
    },
    { status: 409 }
  );
}
