/**
 * In-process sliding-window rate limiter.
 *
 * ⚠️  Vercel / serverless note
 * Each serverless function invocation may run in an isolated process, so this
 * counter is per-instance, not globally shared. It will still prevent bursts
 * within a single warm instance, but for true distributed rate limiting on
 * Vercel replace the Map store below with Upstash Redis:
 *   https://github.com/upstash/ratelimit
 *
 * Usage:
 *   const result = checkRateLimit(ip);
 *   if (!result.allowed) return 429;
 */

interface WindowEntry {
  count: number;
  windowStart: number;
}

const store = new Map<string, WindowEntry>();

export const RATE_LIMIT_MAX = 5;          // max requests per window per key
export const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute

/** Remove stale entries to prevent unbounded memory growth. */
function purgeExpired(): void {
  const now = Date.now();
  Array.from(store.entries()).forEach(([key, entry]) => {
    if (now - entry.windowStart >= RATE_LIMIT_WINDOW_MS) {
      store.delete(key);
    }
  });
}

/** Clear all rate limit counters. Intended for use in tests only. */
export function resetRateLimitStore(): void {
  store.clear();
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;  // requests left in the current window
  retryAfterMs: number; // ms until the window resets (0 if allowed)
}

/**
 * Check and increment the rate limit counter for a given key (typically an
 * IP address). Uses a fixed sliding window — the window resets fully after
 * RATE_LIMIT_WINDOW_MS from the first request in that window.
 */
export function checkRateLimit(key: string): RateLimitResult {
  purgeExpired();

  const now = Date.now();
  const entry = store.get(key);

  // No entry or expired window → start a fresh window
  if (!entry || now - entry.windowStart >= RATE_LIMIT_WINDOW_MS) {
    store.set(key, { count: 1, windowStart: now });
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1, retryAfterMs: 0 };
  }

  // Window active and limit reached
  if (entry.count >= RATE_LIMIT_MAX) {
    const retryAfterMs = RATE_LIMIT_WINDOW_MS - (now - entry.windowStart);
    return { allowed: false, remaining: 0, retryAfterMs };
  }

  // Window active, increment counter
  entry.count += 1;
  return {
    allowed: true,
    remaining: RATE_LIMIT_MAX - entry.count,
    retryAfterMs: 0,
  };
}
