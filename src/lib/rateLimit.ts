import { NextResponse } from "next/server";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const MAX_STORE_ENTRIES = 5000;

// Reuse store across hot-reloads / warm serverless invocations within the same instance
const globalForRateLimit = globalThis as unknown as {
  __kimtvRateLimitStore?: Map<string, RateLimitEntry>;
};

const store: Map<string, RateLimitEntry> =
  globalForRateLimit.__kimtvRateLimitStore ??
  new Map<string, RateLimitEntry>();

if (!globalForRateLimit.__kimtvRateLimitStore) {
  globalForRateLimit.__kimtvRateLimitStore = store;
}

function cleanupExpired(now: number): void {
  if (store.size <= MAX_STORE_ENTRIES) return;
  for (const [k, entry] of store.entries()) {
    if (entry.resetAt <= now) {
      store.delete(k);
    }
  }
  // If still oversized after pruning expired entries, evict oldest entries
  while (store.size > MAX_STORE_ENTRIES) {
    const oldestKey = store.keys().next().value;
    if (!oldestKey) break;
    store.delete(oldestKey);
  }
}

export function getClientIp(request: Request): string {
  const candidates = [
    request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim(),
    request.headers.get("x-real-ip")?.trim(),
    request.headers.get("cf-connecting-ip")?.trim(),
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
  ];

  for (const candidate of candidates) {
    if (candidate && candidate.length > 0) {
      return candidate.slice(0, 64);
    }
  }
  return "unknown";
}

export function getRateLimitStatus(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; remaining: number; retryAfterSeconds: number } {
  const now = Date.now();
  const existing = store.get(key);

  if (!existing || existing.resetAt <= now) {
    if (existing) store.delete(key);
    return {
      allowed: true,
      remaining: limit,
      retryAfterSeconds: Math.ceil(windowMs / 1000),
    };
  }

  const remaining = Math.max(0, limit - existing.count);
  const retryAfterSeconds = Math.max(
    1,
    Math.ceil((existing.resetAt - now) / 1000)
  );
  return {
    allowed: existing.count < limit,
    remaining,
    retryAfterSeconds,
  };
}

export function consumeRateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; remaining: number; retryAfterSeconds: number } {
  const now = Date.now();
  cleanupExpired(now);

  const existing = store.get(key);
  if (!existing || existing.resetAt <= now) {
    const resetAt = now + windowMs;
    store.set(key, { count: 1, resetAt });
    return {
      allowed: true,
      remaining: Math.max(0, limit - 1),
      retryAfterSeconds: Math.ceil(windowMs / 1000),
    };
  }

  existing.count += 1;
  const retryAfterSeconds = Math.max(
    1,
    Math.ceil((existing.resetAt - now) / 1000)
  );

  if (existing.count > limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds,
    };
  }

  return {
    allowed: true,
    remaining: Math.max(0, limit - existing.count),
    retryAfterSeconds,
  };
}

export function resetRateLimit(key: string): void {
  store.delete(key);
}

export function rateLimitResponse(
  retryAfterSeconds: number,
  message = "Terlalu banyak permintaan. Silakan coba lagi nanti."
): NextResponse {
  return NextResponse.json(
    { error: message },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfterSeconds),
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
        "Surrogate-Control": "no-store",
      },
    }
  );
}

