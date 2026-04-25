import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { rateLimit } from "@/lib/ai/rate-limit";

// `rateLimit` is the gate on /api/ai/chat. The behavior we care about:
// a fresh key starts allowed, the bucket drains exactly to capacity,
// and tokens refill at the advertised rate.

describe("rateLimit", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows up to capacity in a tight burst, then rejects", () => {
    const key = "user-burst";
    expect(rateLimit(key, 3, 1).ok).toBe(true);
    expect(rateLimit(key, 3, 1).ok).toBe(true);
    expect(rateLimit(key, 3, 1).ok).toBe(true);

    const blocked = rateLimit(key, 3, 1);
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) {
      expect(blocked.retryAfterSec).toBeGreaterThan(0);
    }
  });

  it("refills at the advertised rate", () => {
    const key = "user-refill";
    // Drain.
    rateLimit(key, 2, 1);
    rateLimit(key, 2, 1);
    expect(rateLimit(key, 2, 1).ok).toBe(false);

    // Advance 1.5s — at 1 token/sec we should have 1 full token back.
    vi.advanceTimersByTime(1500);
    expect(rateLimit(key, 2, 1).ok).toBe(true);
    // No further tokens immediately available.
    expect(rateLimit(key, 2, 1).ok).toBe(false);
  });

  it("never lets the bucket overfill past capacity", () => {
    const key = "user-cap";
    // Wait a long time before first call — bucket starts at capacity,
    // shouldn't grow beyond it just because time passed.
    vi.advanceTimersByTime(10_000);
    expect(rateLimit(key, 2, 1).ok).toBe(true);
    expect(rateLimit(key, 2, 1).ok).toBe(true);
    expect(rateLimit(key, 2, 1).ok).toBe(false);
  });

  it("isolates buckets per key", () => {
    expect(rateLimit("a", 1, 1).ok).toBe(true);
    expect(rateLimit("a", 1, 1).ok).toBe(false);
    // Different key, untouched bucket — still allowed.
    expect(rateLimit("b", 1, 1).ok).toBe(true);
  });

  it("returns a positive retryAfterSec when blocked", () => {
    const key = "user-retry";
    rateLimit(key, 1, 0.5); // 1 token, 1 every 2s
    const blocked = rateLimit(key, 1, 0.5);
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) {
      // 1 token at 0.5 tokens/sec = 2s. Allow off-by-one rounding.
      expect(blocked.retryAfterSec).toBeGreaterThanOrEqual(1);
      expect(blocked.retryAfterSec).toBeLessThanOrEqual(3);
    }
  });
});
