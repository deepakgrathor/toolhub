/**
 * Abuse protection: per-tool daily caps + cooldown enforcement via Redis.
 * Keys follow the pattern:  abuse:daily:{userId}:{toolSlug}:{YYYY-MM-DD}
 *                           abuse:cooldown:{userId}:{toolSlug}
 */

import { getRedis } from "@toolhub/shared";

// Tools that have a 30-second cooldown between calls
const HEAVY_TOOLS = new Set([
  "website-generator",
  "legal-notice",
  "nda-generator",
  "seo-auditor",
  "thumbnail-ai",
]);

// Daily caps per tool per plan tier
// null = no cap for that plan
const DAILY_CAPS: Record<string, Record<string, number | null>> = {
  "website-generator": {
    free: 0,
    lite: 3,
    pro: 10,
    business: 10,
    enterprise: 10,
  },
  "thumbnail-ai": {
    free: 5,
    lite: 5,
    pro: 5,
    business: 5,
    enterprise: 5,
  },
};

const COOLDOWN_SECONDS = 30;

function todayKey(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

export interface AbuseCheckResult {
  allowed: boolean;
  reason?: string;
  retryAfter?: number;
}

export async function checkAbuseLimit({
  userId,
  toolSlug,
  planSlug,
}: {
  userId: string;
  toolSlug: string;
  planSlug: string;
}): Promise<AbuseCheckResult> {
  try {
    const redis = getRedis();

    // ── Daily cap check ───────────────────────────────────────────────────────
    const caps = DAILY_CAPS[toolSlug];
    if (caps) {
      const cap = caps[planSlug] ?? caps["pro"] ?? null;
      if (cap !== null) {
        const dailyKey = `abuse:daily:${userId}:${toolSlug}:${todayKey()}`;
        // Get current count first (don't increment yet)
        const current = await redis.get<number>(dailyKey);
        const count = current ?? 0;

        if (count >= cap) {
          return {
            allowed: false,
            reason: `Daily limit reached for ${toolSlug} (${cap}/day on your plan). Resets at midnight.`,
          };
        }

        // Increment counter with TTL = seconds until end of today
        const now = new Date();
        const endOfDay = new Date(now);
        endOfDay.setHours(23, 59, 59, 999);
        const ttl = Math.ceil((endOfDay.getTime() - now.getTime()) / 1000);

        await redis.set(dailyKey, count + 1, { ex: ttl });
      }
    }

    // ── Cooldown check ────────────────────────────────────────────────────────
    if (HEAVY_TOOLS.has(toolSlug)) {
      const cooldownKey = `abuse:cooldown:${userId}:${toolSlug}`;
      const existing = await redis.get(cooldownKey);

      if (existing !== null) {
        // Key exists → user is in cooldown; get TTL
        const ttl = await redis.ttl(cooldownKey);
        return {
          allowed: false,
          reason: `Please wait ${ttl > 0 ? ttl : COOLDOWN_SECONDS} seconds before using this tool again.`,
          retryAfter: ttl > 0 ? ttl : COOLDOWN_SECONDS,
        };
      }

      // Set cooldown key
      await redis.set(cooldownKey, "1", { ex: COOLDOWN_SECONDS });
    }

    return { allowed: true };
  } catch {
    // Redis unavailable — fail open (don't block users)
    return { allowed: true };
  }
}
