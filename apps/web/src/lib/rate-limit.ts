interface RateLimitOptions {
  windowMs: number;
  max: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export function createRateLimit(options: RateLimitOptions) {
  const store = new Map<string, { count: number; resetAt: number }>();

  return function rateLimit(key: string): RateLimitResult {
    const now = Date.now();
    const entry = store.get(key);

    if (!entry || now > entry.resetAt) {
      store.set(key, { count: 1, resetAt: now + options.windowMs });
      return { allowed: true, remaining: options.max - 1, resetAt: now + options.windowMs };
    }

    if (entry.count >= options.max) {
      return { allowed: false, remaining: 0, resetAt: entry.resetAt };
    }

    entry.count++;
    return { allowed: true, remaining: options.max - entry.count, resetAt: entry.resetAt };
  };
}
