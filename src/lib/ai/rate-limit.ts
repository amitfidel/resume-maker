/**
 * Tiny in-memory token-bucket rate limiter, scoped per process.
 *
 * Why not Upstash / Redis: this is a single-region Vercel deployment,
 * one user mostly hits one instance, and the goal here is to stop a
 * stuck loop or a careless retry from melting the Groq budget — not to
 * prevent a coordinated DDoS. If we ever scale horizontally, swap the
 * `Map` out for a Redis-backed store with the same shape.
 *
 * Each key gets `capacity` tokens; tokens refill at `refillPerSec`. A
 * call that finds the bucket empty is rejected and returned the seconds
 * until the next token would be available. Buckets are evicted lazily.
 */

type Bucket = {
  tokens: number;
  lastRefill: number; // ms epoch
};

const buckets = new Map<string, Bucket>();

// Drop buckets that haven't been touched in 10 minutes so a long-running
// process doesn't leak memory by tracking ex-users forever.
const STALE_AFTER_MS = 10 * 60 * 1000;
let lastSweep = 0;

function maybeSweep(now: number) {
  if (now - lastSweep < STALE_AFTER_MS) return;
  lastSweep = now;
  for (const [k, b] of buckets) {
    if (now - b.lastRefill > STALE_AFTER_MS) buckets.delete(k);
  }
}

export function rateLimit(
  key: string,
  capacity: number,
  refillPerSec: number,
): { ok: true } | { ok: false; retryAfterSec: number } {
  const now = Date.now();
  maybeSweep(now);

  const existing = buckets.get(key);
  const bucket: Bucket = existing ?? { tokens: capacity, lastRefill: now };

  if (existing) {
    const elapsedSec = (now - existing.lastRefill) / 1000;
    bucket.tokens = Math.min(capacity, existing.tokens + elapsedSec * refillPerSec);
    bucket.lastRefill = now;
  }

  if (bucket.tokens < 1) {
    const deficit = 1 - bucket.tokens;
    const retryAfterSec = Math.ceil(deficit / refillPerSec);
    buckets.set(key, bucket);
    return { ok: false, retryAfterSec };
  }

  bucket.tokens -= 1;
  buckets.set(key, bucket);
  return { ok: true };
}
