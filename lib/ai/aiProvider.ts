/**
 * The one seam between LivLab and whichever LLM is behind it.
 *
 * Kept deliberately small: LivLab needs exactly one thing from a model —
 * "given a system instruction, a bounded conversation and a JSON schema, return
 * JSON that matches the schema". Everything factual (products, prices, budget)
 * is resolved by LivLab code before the model is ever called, so the provider
 * never needs tool-calling, streaming or multi-turn negotiation.
 *
 * Swapping providers means writing one more implementation of this interface.
 * No UI or service code changes.
 */

export type AIRole = 'user' | 'model';

export interface AIMessage {
  role: AIRole;
  text: string;
}

export interface AIGenerateRequest {
  systemInstruction: string;
  /** Bounded conversation history, oldest first. */
  history: AIMessage[];
  /** The current user message. */
  message: string;
  /** JSON schema the response must conform to, in the provider's own dialect. */
  responseSchema: unknown;
  temperature?: number;
  maxOutputTokens?: number;
  /** Abort budget in ms; the provider should give up rather than hang the UI. */
  timeoutMs?: number;
}

export type AIFailureReason =
  /** No API key configured — the feature is simply switched off. */
  | 'not-configured'
  /** Free-tier quota or rate limit hit. Never retry aggressively. */
  | 'quota'
  /** Network, timeout, or provider outage. */
  | 'unavailable'
  /** Provider answered, but not with usable JSON. */
  | 'bad-response';

export interface AIGenerateSuccess<T> {
  ok: true;
  data: T;
  /** Metadata only — never user content. Used for lightweight observability. */
  meta: { model: string; latencyMs: number };
}

export interface AIGenerateFailure {
  ok: false;
  reason: AIFailureReason;
  meta: { model: string; latencyMs: number };
}

export type AIGenerateResult<T> = AIGenerateSuccess<T> | AIGenerateFailure;

export interface AIProvider {
  readonly name: string;
  /** False when the provider has no credentials; callers degrade gracefully. */
  isConfigured(): boolean;
  generateJson<T>(request: AIGenerateRequest): Promise<AIGenerateResult<T>>;
}
