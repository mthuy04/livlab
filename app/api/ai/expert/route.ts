import { NextResponse } from 'next/server';
import { askLivLabExpert, EXPERT_STATUS_MESSAGES } from '@/lib/ai/expert/livlabExpertService';
import { checkRateLimit } from '@/lib/ai/expert/rateLimiter';
import { MAX_USER_MESSAGE_CHARS } from '@/lib/ai/expert/expertContext';
import type { ExpertApiResponse, LivLabExpertContext } from '@/lib/ai/expert/expertContext';

/**
 * LivLab Expert endpoint.
 *
 * Every Gemini call in this feature goes through here, so GEMINI_API_KEY stays
 * on the server. The client only ever sends Room Studio context and receives
 * validated, catalogue-backed results.
 *
 * Note the status codes: a quota or outage returns HTTP 200 with a degraded
 * status in the body. The client is not failing — Room Studio is fine and the
 * customer just gets a friendly message — so this is not a 5xx.
 */

export const runtime = 'nodejs';

interface ExpertRequestBody {
  message?: unknown;
  history?: unknown;
  context?: unknown;
}

/** Best-effort client key for throttling. Not an identity, never stored. */
function getClientKey(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  return (forwarded?.split(',')[0] || request.headers.get('x-real-ip') || 'anonymous').trim();
}

export async function POST(request: Request) {
  let body: ExpertRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json<ExpertApiResponse>(
      { status: 'invalid', message: EXPERT_STATUS_MESSAGES.invalid },
      { status: 400 }
    );
  }

  const message = typeof body.message === 'string' ? body.message.trim() : '';
  if (!message || message.length > MAX_USER_MESSAGE_CHARS) {
    return NextResponse.json<ExpertApiResponse>({
      status: 'invalid',
      message: EXPERT_STATUS_MESSAGES.invalid,
    });
  }

  const decision = checkRateLimit(getClientKey(request), message);
  if (!decision.allowed) {
    return NextResponse.json<ExpertApiResponse>({
      status: 'throttled',
      message:
        decision.reason === 'too-many'
          ? EXPERT_STATUS_MESSAGES.quota
          : EXPERT_STATUS_MESSAGES.throttled,
    });
  }

  const history = Array.isArray(body.history)
    ? body.history
        .filter(
          (m): m is { role: 'user' | 'assistant'; text: string } =>
            Boolean(m) &&
            typeof m === 'object' &&
            typeof (m as { text?: unknown }).text === 'string' &&
            ((m as { role?: unknown }).role === 'user' || (m as { role?: unknown }).role === 'assistant')
        )
        .map((m) => ({ role: m.role, text: m.text.slice(0, MAX_USER_MESSAGE_CHARS) }))
    : [];

  const context = (body.context && typeof body.context === 'object' ? body.context : {}) as LivLabExpertContext;

  try {
    const result = await askLivLabExpert({ message, history, context });
    return NextResponse.json<ExpertApiResponse>(result);
  } catch (error) {
    console.error('[LivLab Expert] route failed', error instanceof Error ? error.message : error);
    return NextResponse.json<ExpertApiResponse>({
      status: 'unavailable',
      message: EXPERT_STATUS_MESSAGES.unavailable,
    });
  }
}
