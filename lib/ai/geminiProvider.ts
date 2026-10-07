import { GoogleGenAI } from '@google/genai';
import type {
  AIGenerateRequest,
  AIGenerateResult,
  AIFailureReason,
  AIProvider,
} from './aiProvider';

/**
 * Gemini implementation of AIProvider.
 *
 * GEMINI_API_KEY is read only inside this module, which is imported solely by
 * the /api/ai/expert route handler. The module-scope guard below turns an
 * accidental client import into an immediate, obvious crash rather than a
 * silent key leak (the `server-only` package is not a dependency here, so this
 * is the dependency-free equivalent).
 *
 * Model default matches the convention already used by /api/ai/suggest and
 * /api/ai/chat, so all three read the same env vars.
 */

if (typeof window !== 'undefined') {
  throw new Error('geminiProvider must never be imported into client code — it reads GEMINI_API_KEY.');
}

const DEFAULT_MODEL = 'gemini-2.5-flash';
const DEFAULT_TIMEOUT_MS = 20_000;
const DEFAULT_MAX_OUTPUT_TOKENS = 1600;

/** Maps a provider error onto the small set of reasons the UI knows how to show. */
function classifyError(error: unknown): AIFailureReason {
  const text = (error instanceof Error ? `${error.name} ${error.message}` : String(error)).toLowerCase();
  if (text.includes('abort') || text.includes('timeout') || text.includes('etimedout')) return 'unavailable';
  if (
    text.includes('429') ||
    text.includes('quota') ||
    text.includes('rate limit') ||
    text.includes('resource_exhausted')
  ) {
    return 'quota';
  }
  if (text.includes('503') || text.includes('502') || text.includes('unavailable') || text.includes('fetch failed')) {
    return 'unavailable';
  }
  return 'unavailable';
}

export class GeminiProvider implements AIProvider {
  readonly name = 'gemini';

  private get apiKey(): string | undefined {
    return process.env.GEMINI_API_KEY;
  }

  get model(): string {
    return process.env.GEMINI_MODEL || DEFAULT_MODEL;
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey);
  }

  async generateJson<T>(request: AIGenerateRequest): Promise<AIGenerateResult<T>> {
    const model = this.model;
    const startedAt = Date.now();

    if (!this.apiKey) {
      return { ok: false, reason: 'not-configured', meta: { model, latencyMs: 0 } };
    }

    const ai = new GoogleGenAI({ apiKey: this.apiKey });

    // The SDK has no timeout option, so the abort signal is what stops a hung
    // request from leaving the user watching a spinner forever.
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), request.timeoutMs ?? DEFAULT_TIMEOUT_MS);

    try {
      const contents = [
        ...request.history.map((m) => ({ role: m.role, parts: [{ text: m.text }] })),
        { role: 'user' as const, parts: [{ text: request.message }] },
      ];

      const response = await ai.models.generateContent({
        model,
        contents,
        config: {
          systemInstruction: request.systemInstruction,
          temperature: request.temperature ?? 0.4,
          maxOutputTokens: request.maxOutputTokens ?? DEFAULT_MAX_OUTPUT_TOKENS,
          // Gemini 2.5 Flash is a thinking model, and thinking tokens are
          // charged against maxOutputTokens. Left on, a few hundred of them are
          // spent before the first output token — which silently truncated the
          // JSON response to nothing. LivLab has already done the reasoning
          // that matters (budget maths, catalogue search) deterministically
          // before the model is called, so thinking buys nothing here and
          // costs free-tier quota and latency.
          thinkingConfig: { thinkingBudget: 0 },
          responseMimeType: 'application/json',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          responseSchema: request.responseSchema as any,
          abortSignal: controller.signal,
        },
      });

      const latencyMs = Date.now() - startedAt;
      const finishReason = response.candidates?.[0]?.finishReason;
      const text = response.text;

      if (!text) {
        // Logged distinctly: an empty body from a truncated response is a
        // configuration problem, not an outage, and looks nothing like one in
        // production unless it is named.
        console.error('[LivLab Expert] empty gemini response', { model, finishReason, latencyMs });
        return { ok: false, reason: 'bad-response', meta: { model, latencyMs } };
      }

      try {
        return { ok: true, data: JSON.parse(text) as T, meta: { model, latencyMs } };
      } catch {
        return { ok: false, reason: 'bad-response', meta: { model, latencyMs } };
      }
    } catch (error) {
      const latencyMs = Date.now() - startedAt;
      const reason = classifyError(error);
      // Metadata only — the user's message and room contents are never logged.
      console.error('[LivLab Expert] gemini call failed', { model, reason, latencyMs });
      return { ok: false, reason, meta: { model, latencyMs } };
    } finally {
      clearTimeout(timer);
    }
  }
}

let cached: GeminiProvider | null = null;

export function getAIProvider(): AIProvider {
  if (!cached) cached = new GeminiProvider();
  return cached;
}
