import { NextResponse } from "next/server";
import { connectDB, Kit } from "@toolhub/db";
import { getRedis } from "@toolhub/shared";

export const dynamic = "force-dynamic";

const CACHE_KEY = "kits:public";
const CACHE_TTL = 10 * 60; // 10 min

export async function GET() {
  try {
    // Try Redis cache first
    try {
      const redis = getRedis();
      const cached = await redis.get(CACHE_KEY);
      if (cached) {
        const response = NextResponse.json({ kits: cached });
        response.headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
        return response;
      }
    } catch {
      // Redis unavailable — continue to DB
    }

    await connectDB();
    const kits = await Kit.find({ isActive: true }).sort({ order: 1 }).lean();

    // Cache result
    try {
      const redis = getRedis();
      await redis.set(CACHE_KEY, kits, { ex: CACHE_TTL });
    } catch {
      // silent
    }

    const response = NextResponse.json({ kits });
    response.headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    return response;
  } catch (err) {
    console.error("[GET /api/public/kits]", err);
    return NextResponse.json({ error: "Failed to fetch kits" }, { status: 500 });
  }
}
