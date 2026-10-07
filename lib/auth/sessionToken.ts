/**
 * Signed session tokens.
 *
 * The previous cookie was `base64(JSON)`, which is encoding, not signing — a
 * hand-written cookie containing any user's id was accepted as that user, with
 * no password. base64 says "here is who I claim to be"; a signature says "the
 * server issued this". This module provides the second.
 *
 * Format: base64url(payload).base64url(HMAC-SHA256(payload))
 *
 * Built on Web Crypto rather than node:crypto so the exact same code verifies
 * in a Node route handler and in the proxy, whichever runtime it ends up on.
 */

export interface SessionPayload {
  /** User id — the only field authorization is ultimately derived from. */
  id: string;
  /**
   * Role at sign-in time, carried so the proxy can gate routes without a
   * database round-trip on every navigation. Now server-issued and tamper
   * proof, but still a SNAPSHOT: an admin can change a role mid-session, so
   * API routes re-read it from the database via getSessionUser(). This is a
   * cheap gate, never the authority.
   */
  role: string;
  /** Issued at, epoch seconds. */
  iat: number;
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(value: string): Uint8Array {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/**
 * The signing key.
 *
 * SESSION_SECRET is the intended source. When it is absent the key is derived
 * from DATABASE_URL instead — a server-only value that already exists in every
 * environment this app runs in. That fallback is deliberate: requiring a new
 * variable would have logged every showroom out of any deployment where it had
 * not been added yet, trading one broken login for another. It is a stopgap,
 * not a design: set SESSION_SECRET.
 */
function getSecret(): string {
  const explicit = process.env.SESSION_SECRET;
  if (explicit && explicit.length > 0) return explicit;

  const derived = process.env.DATABASE_URL;
  if (derived && derived.length > 0) return `livlab-session-fallback:${derived}`;

  // Both missing means the server is misconfigured. Throwing is correct: the
  // alternative is signing with a constant, which is the hole this file exists
  // to close.
  throw new Error('Cannot sign sessions: set SESSION_SECRET.');
}

async function getKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(getSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

/** Constant-time compare. Bailing on the first mismatch leaks the signature. */
function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a[i] ^ b[i];
  return diff === 0;
}

export async function signSession(payload: Omit<SessionPayload, 'iat'>): Promise<string> {
  const body = base64UrlEncode(
    encoder.encode(JSON.stringify({ ...payload, iat: Math.floor(Date.now() / 1000) }))
  );
  const signature = await crypto.subtle.sign('HMAC', await getKey(), encoder.encode(body));
  return `${body}.${base64UrlEncode(new Uint8Array(signature))}`;
}

/**
 * Returns the payload only for a token this server signed.
 *
 * Anything else — tampered, truncated, or a legacy unsigned cookie — returns
 * null and is treated as "not logged in". Legacy cookies are deliberately NOT
 * accepted for a grace period: every one of them is forgeable, so honouring
 * them would keep the vulnerability open for exactly as long as the grace
 * period lasted. The cost is that sessions issued before this change require
 * one fresh login.
 */
export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const separator = token.lastIndexOf('.');
    if (separator <= 0) return null;

    const body = token.slice(0, separator);
    const signature = base64UrlDecode(token.slice(separator + 1));

    const expected = new Uint8Array(
      await crypto.subtle.sign('HMAC', await getKey(), encoder.encode(body))
    );
    if (!timingSafeEqual(signature, expected)) return null;

    const payload = JSON.parse(decoder.decode(base64UrlDecode(body))) as SessionPayload;
    return payload?.id ? payload : null;
  } catch {
    // Malformed token. Indistinguishable from "no session" on purpose — the
    // caller should not branch on why a stranger's cookie failed.
    return null;
  }
}

export const SESSION_COOKIE = 'livlab_session';
/** One week, matching the cookie's own maxAge. */
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7;
