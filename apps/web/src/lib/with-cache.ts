import { getRedis } from "@toolhub/shared";

export async function withCache<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>
): Promise<T> {
  try {
    const redis = getRedis();
    const cached = await redis.get(key);
    if (cached !== null) {
      return cached as T;
    }
  } catch {
    // Redis unavailable — fall through to fetcher
  }

  const data = await fetcher();

  try {
    const redis = getRedis();
    await redis.set(key, JSON.stringify(data), { ex: ttlSeconds });
  } catch {
    // Cache write failed — not critical, return data anyway
  }

  return data;
}

export async function invalidateCache(...keys: string[]): Promise<void> {
  try {
    const redis = getRedis();
    await Promise.all(keys.map((k) => redis.del(k)));
  } catch {
    // Non-critical
  }
}
