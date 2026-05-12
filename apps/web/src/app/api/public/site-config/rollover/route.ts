import { NextResponse } from "next/server";
import { connectDB, SiteConfig } from "@toolhub/db";
import { getRedis } from "@toolhub/shared";

const CACHE_KEY = "site-config:rollover";
const CACHE_TTL = 300; // 5 min

export async function GET() {
  try {
    const redis = getRedis();
    const cached = await redis.get(CACHE_KEY);
    if (cached) {
      return NextResponse.json(JSON.parse(cached as string));
    }
  } catch {
    // Redis unavailable — fall through to DB
  }

  try {
    await connectDB();
    const [enabledDoc, daysDoc] = await Promise.all([
      SiteConfig.findOne({ key: "credit_rollover_enabled" }).lean(),
      SiteConfig.findOne({ key: "credit_rollover_days" }).lean(),
    ]);

    const result = {
      enabled: (enabledDoc?.value as boolean) ?? false,
      maxDays: (daysDoc?.value as number) ?? 30,
    };

    try {
      const redis = getRedis();
      await redis.set(CACHE_KEY, JSON.stringify(result), { ex: CACHE_TTL });
    } catch {
      // silent
    }

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ enabled: false, maxDays: 30 });
  }
}
