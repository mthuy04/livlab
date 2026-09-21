/**
 * Free-tier protection for the Expert endpoint.
 *
 * LivLab runs Gemini on the free tier, so the goal is to keep a stuck client,
 * a double-submit or one over-enthusiastic visitor from burning the shared
 * daily quota for everyone.
 *
 * In-memory and per-process on purpose: it is a guard rail, not a security
 * control, and adding Redis for it would mean new infrastructure this phase
 * explicitly does not want. On serverless each instance keeps its own window,
 * which is still enough to stop the realistic failure mode (one browser
 * hammering send).
 */

interface Window {
  timestamps: number[];
  /** Hash of the last message, to swallow accidental double-submits. */
  lastSignature?: string;
  lastAt?: number;
}

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 12;
const MIN_GAP_MS = 1_500;
const DUPLICATE_WINDOW_MS = 5_000;
const MAX_TRACKED_CLIENTS = 500;

const windows = new Map<string, Window>();

export type RateDecision = { allowed: true } | { allowed: false; reason: 'too-fast' | 'too-many' | 'duplicate' };

function signature(text: string): string {
  return text.trim().toLowerCase().slice(0, 200);
}

export function checkRateLimit(clientKey: string, message: string): RateDecision {
  const now = Date.now();

  // Cheap bound on memory: drop the oldest half once the map grows too large.
  if (windows.size > MAX_TRACKED_CLIENTS) {
    const stale = Array.from(windows.entries())
      .sort((a, b) => (a[1].lastAt ?? 0) - (b[1].lastAt ?? 0))
      .slice(0, Math.floor(MAX_TRACKED_CLIENTS / 2));
    stale.forEach(([key]) => windows.delete(key));
  }

  const entry = windows.get(clientKey) ?? { timestamps: [] };
  entry.timestamps = entry.timestamps.filter((t) => now - t < WINDOW_MS);

  const sig = signature(message);
  if (entry.lastSignature === sig && entry.lastAt && now - entry.lastAt < DUPLICATE_WINDOW_MS) {
    return { allowed: false, reason: 'duplicate' };
  }
  if (entry.lastAt && now - entry.lastAt < MIN_GAP_MS) {
    return { allowed: false, reason: 'too-fast' };
  }
  if (entry.timestamps.length >= MAX_PER_WINDOW) {
    return { allowed: false, reason: 'too-many' };
  }

  entry.timestamps.push(now);
  entry.lastAt = now;
  entry.lastSignature = sig;
  windows.set(clientKey, entry);
  return { allowed: true };
}
