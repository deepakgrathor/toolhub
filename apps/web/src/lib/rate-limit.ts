import { getRedis } from "@toolhub/shared";

export async function rateLimit(
  identifier: string,
  limit: number,
  windowSeconds: number
): Promise<{ success: boolean; remaining: number; reset: number }> {
  const key = `rl:${identifier}`;

  try {
    const redis = getRedis();
    const current = await redis.incr(key);

    if (current === 1) {
      await redis.expire(key, windowSeconds);
    }

    const ttl = await redis.ttl(key);
    const remaining = Math.max(0, limit - current);

    return {
      success: current <= limit,
      remaining,
      reset: Date.now() + ttl * 1000,
    };
  } catch (error) {
    // Redis down — fail open so users are never blocked due to infra issues
    console.error("[rate-limit] Redis error:", error);
    return { success: true, remaining: 1, reset: Date.now() + windowSeconds * 1000 };
  }
}
