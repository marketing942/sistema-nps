/**
 * Rate limiter em memória (per server instance).
 * Para produção em múltiplas instâncias, mover para Upstash/Redis.
 */
type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export function rateLimit(
  key: string,
  max: number,
  windowMs: number
): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: max - 1, resetIn: windowMs };
  }
  if (b.count >= max) {
    return { allowed: false, remaining: 0, resetIn: b.resetAt - now };
  }
  b.count++;
  return {
    allowed: true,
    remaining: max - b.count,
    resetIn: b.resetAt - now,
  };
}

export function getClientIp(headers: Headers): string {
  const fwd = headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  const real = headers.get("x-real-ip");
  if (real) return real.trim();
  return "anon";
}

// Best-effort: occasionally clean up expired buckets to avoid leaks.
let lastCleanup = Date.now();
export function cleanupBuckets() {
  const now = Date.now();
  if (now - lastCleanup < 60_000) return;
  lastCleanup = now;
  for (const [k, b] of buckets) {
    if (b.resetAt < now) buckets.delete(k);
  }
}
