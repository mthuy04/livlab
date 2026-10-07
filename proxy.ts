import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { SESSION_COOKIE, verifySession } from '@/lib/auth/sessionToken';

/**
 * Route gate for the admin and showroom portals.
 *
 * Renamed from middleware.ts per Next 16, which deprecated that convention in
 * favour of `proxy` (and runs it on the Node runtime).
 *
 * This verifies the session SIGNATURE before reading anything out of it. The
 * previous version decoded the cookie and trusted whatever role it found, so a
 * hand-written cookie saying `role: "ADMIN"` opened the admin shell. API routes
 * denied those requests because they re-read the role from the database, but
 * the gate itself was decorative.
 *
 * It remains a cheap gate, not the authority: the role here is a snapshot from
 * sign-in time, and every API route still resolves the real role and showroom
 * through getSessionUser(). Authorization must not depend on this file alone.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySession(token) : null;

  if (!session) {
    return redirectToLogin(request);
  }

  if (pathname.startsWith('/admin') && session.role !== 'ADMIN') {
    return redirectToLogin(request);
  }

  if (pathname.startsWith('/showroom') && session.role !== 'SHOWROOM' && session.role !== 'ADMIN') {
    return redirectToLogin(request);
  }

  return NextResponse.next();
}

/**
 * Carries where the user was going, so a signed-out user who opens a deep link
 * lands there after logging in instead of on a generic dashboard.
 */
function redirectToLogin(request: NextRequest) {
  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('next', request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/admin/:path*', '/showroom/:path*'],
};
