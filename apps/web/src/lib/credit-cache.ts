/**
 * Redis-cached credit balance helpers.
 * Wraps CreditService with a 5-minute Upstash cache.
 * Invalidate on every deduction/addition so balance is always fresh after use.
 */

import { getRedis } from "@toolhub/shared";

const BALANCE_TTL = 5 * 60; // 5 min

function key(userId: string) {
  return `SetuLix:credits:${userId}`;
}

// ── Read ──────────────────────────────────────────────────────────────────────

export async function getCachedBalance(userId: string): Promise<number | null> {
  try {
    const redis = getRedis();
    const val = await redis.get<number>(key(userId));
    return val ?? null;
  } catch {
    return null;
  }
}

export async function setCachedBalance(userId: string, balance: number): Promise<void> {
  try {
    const redis = getRedis();
    await redis.set(key(userId), balance, { ex: BALANCE_TTL });
  } catch {
    // Redis unavailable — silent fail, no caching
  }
}

export async function invalidateBalance(userId: string): Promise<void> {
  try {
    const redis = getRedis();
    await redis.del(key(userId));
  } catch {
    // silent
  }
}

// ── Dashboard stats ───────────────────────────────────────────────────────────

const DASH_TTL = 2 * 60; // 2 min

function dashKey(userId: string) {
  return `SetuLix:dashboard:${userId}`;
}

export interface DashboardStats {
  toolsUsed: number;
  creditsUsed: number;
  memberSince: string;
}

export async function getCachedDashStats(
  userId: string
): Promise<DashboardStats | null> {
  try {
    const redis = getRedis();
    return await redis.get<DashboardStats>(dashKey(userId));
  } catch {
    return null;
  }
}

export async function setCachedDashStats(
  userId: string,
  stats: DashboardStats
): Promise<void> {
  try {
    const redis = getRedis();
    await redis.set(dashKey(userId), stats, { ex: DASH_TTL });
  } catch {
    // silent
  }
}

export async function invalidateDashStats(userId: string): Promise<void> {
  try {
    const redis = getRedis();
    await redis.del(dashKey(userId));
  } catch {
    // silent
  }
}
