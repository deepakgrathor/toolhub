import { NextResponse } from "next/server";
import { connectDB, OnboardingConfig } from "@toolhub/db";
import { getRedis } from "@toolhub/shared";

const CACHE_KEY = "onboarding:config";
const CACHE_TTL = 3600; // 1 hour

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const redis = getRedis();
    if (redis) {
      const cached = await redis.get(CACHE_KEY);
      if (cached) {
        return NextResponse.json(JSON.parse(cached as string));
      }
    }

    await connectDB();
    const steps = await OnboardingConfig.find({ isActive: true })
      .sort({ order: 1 })
      .lean();

    const payload = { steps };

    if (redis) {
      await redis.set(CACHE_KEY, JSON.stringify(payload), { ex: CACHE_TTL });
    }

    return NextResponse.json(payload);
  } catch (err) {
    console.error("[onboarding/config]", err);
    return NextResponse.json({ steps: [] }, { status: 500 });
  }
}
