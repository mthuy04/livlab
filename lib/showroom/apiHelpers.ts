import { NextResponse } from 'next/server';
import { getSessionUser, hasRole, unauthorized, forbidden, type SessionUser } from '@/lib/auth/session';
import { MigrationPendingError, ShowroomAccessError, requireShowroomId } from './guards';

/**
 * Shared entry check for every showroom API route.
 *
 * Returns either a response to send back immediately, or the authenticated
 * user plus the showroom id they are proven to act for. Routes never read a
 * showroom id from the request body — that is how cross-tenant writes happen.
 */
export async function requireShowroomContext(): Promise<
  { error: NextResponse } | { user: SessionUser; showroomId: string }
> {
  const user = await getSessionUser();
  if (!user) return { error: unauthorized() };
  if (!hasRole(user, 'ADMIN', 'SHOWROOM')) return { error: forbidden() };

  if (user.role === 'SHOWROOM' && !user.showroomId) {
    return {
      error: NextResponse.json(
        {
          error: 'Tài khoản của bạn chưa được gán showroom.',
          code: 'SHOWROOM_UNASSIGNED',
        },
        { status: 409 }
      ),
    };
  }

  try {
    return { user, showroomId: requireShowroomId(user) };
  } catch {
    return { error: forbidden('Không xác định được showroom.') };
  }
}

/** Maps domain errors onto honest status codes instead of a blanket 500. */
export function handleShowroomError(error: unknown): NextResponse {
  if (error instanceof MigrationPendingError) {
    return NextResponse.json({ error: error.message, code: 'MIGRATION_PENDING' }, { status: 503 });
  }
  if (error instanceof ShowroomAccessError) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }
  console.error('[showroom] unexpected error', error);
  return NextResponse.json({ error: 'Đã có lỗi xảy ra.' }, { status: 500 });
}
