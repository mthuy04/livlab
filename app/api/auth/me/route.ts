import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';

/**
 * The client's view of its own session.
 *
 * Delegates to getSessionUser() rather than decoding the cookie itself — the
 * duplicate decode that used to live here was a second place the signature
 * could be forgotten.
 */
export async function GET() {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ ok: false, user: null }, { status: 401 });
  }

  return NextResponse.json({ ok: true, user });
}
