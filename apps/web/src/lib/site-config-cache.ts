import { getRedis } from '@toolhub/shared';
import { connectDB, SiteConfig } from '@toolhub/db';

const SITE_CONFIG_TTL = 60 * 60; // 1 hour

export async function getSiteConfigValue(
  key: string,
  defaultValue: number | string | boolean
): Promise<number | string | boolean> {
  const cacheKey = `site-config:${key}`;

  try {
    const redis = getRedis();
    const cached = await redis.get(cacheKey);
    if (cached !== null) {
      return cached as number | string | boolean;
    }
  } catch {
    // Redis miss — fall through to DB
  }

  await connectDB();
  const doc = await SiteConfig
    .findOne({ key })
    .select('value')
    .lean();

  const value = (doc?.value as number | string | boolean) ?? defaultValue;

  try {
    const redis = getRedis();
    await redis.set(cacheKey, value, { ex: SITE_CONFIG_TTL });
  } catch {
    // Cache write failed — not critical
  }

  return value;
}

export async function invalidateSiteConfigCache(key: string): Promise<void> {
  try {
    const redis = getRedis();
    await redis.del(`site-config:${key}`);
  } catch {
    // Non-critical
  }
}
