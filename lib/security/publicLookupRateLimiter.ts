interface LookupWindow {
  timestamps: number[];
  lastAt: number;
}

const WINDOW_MS = 10 * 60_000;
const MAX_ATTEMPTS = 8;
const MIN_GAP_MS = 750;
const MAX_TRACKED_CLIENTS = 1_000;
const windows = new Map<string, LookupWindow>();

export type LookupRateDecision =
  | { allowed: true }
  | { allowed: false; retryAfterSeconds: number };

/**
 * Best-effort abuse protection for the public quote lookup endpoint.
 *
 * This intentionally stores neither phone numbers nor request codes. The map
 * is bounded and process-local; a shared edge/Redis limiter can replace it
 * later without changing the route contract.
 */
export function checkPublicLookupRateLimit(clientKey: string): LookupRateDecision {
  const now = Date.now();
  if (windows.size >= MAX_TRACKED_CLIENTS && !windows.has(clientKey)) {
    const oldest = [...windows.entries()]
      .sort((a, b) => a[1].lastAt - b[1].lastAt)
      .slice(0, Math.ceil(MAX_TRACKED_CLIENTS / 3));
    oldest.forEach(([key]) => windows.delete(key));
  }

  const entry = windows.get(clientKey) ?? { timestamps: [], lastAt: 0 };
  entry.timestamps = entry.timestamps.filter((timestamp) => now - timestamp < WINDOW_MS);

  if (entry.lastAt && now - entry.lastAt < MIN_GAP_MS) {
    return { allowed: false, retryAfterSeconds: 1 };
  }
  if (entry.timestamps.length >= MAX_ATTEMPTS) {
    const retryAt = entry.timestamps[0] + WINDOW_MS;
    return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((retryAt - now) / 1_000)) };
  }

  entry.timestamps.push(now);
  entry.lastAt = now;
  windows.set(clientKey, entry);
  return { allowed: true };
}
