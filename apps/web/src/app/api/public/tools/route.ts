import { NextResponse } from "next/server";
import { connectDB } from "@toolhub/db";
import { getRedis } from "@toolhub/shared";
import mongoose from "mongoose";

const CACHE_KEY = "public:tools";
const CACHE_TTL = 300; // 5 min

export async function GET() {
  try {
    const redis = getRedis();
    const cached = await redis.get(CACHE_KEY);
    if (cached) {
      return NextResponse.json({ tools: JSON.parse(cached as string) });
    }
  } catch {
    // Redis unavailable
  }

  try {
    await connectDB();
    const db = mongoose.connection.db!;
    const tools = await db
      .collection("tools")
      .find({ isVisible: { $ne: false } })
      .project({ slug: 1, name: 1, kit: 1, description: 1 })
      .toArray();

    try {
      const redis = getRedis();
      await redis.set(CACHE_KEY, JSON.stringify(tools), { ex: CACHE_TTL });
    } catch {
      // silent
    }

    return NextResponse.json({ tools });
  } catch {
    return NextResponse.json({ tools: [], error: "DB unavailable" }, { status: 200 });
  }
}
