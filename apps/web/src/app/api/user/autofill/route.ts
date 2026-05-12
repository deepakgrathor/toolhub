import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB, User, BusinessProfile } from "@toolhub/db";
import { getRedis } from "@toolhub/shared";
import type { AutofillData } from "@/lib/autofill";

const CACHE_TTL = 1800; // 30 minutes

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const cacheKey = `autofill:${userId}`;

  try {
    const redis = getRedis();
    const cached = await redis.get(cacheKey);
    if (cached) {
      return NextResponse.json({ data: JSON.parse(cached as string) });
    }
  } catch {
    // Redis unavailable, continue to DB
  }

  await connectDB();

  const [user, business] = await Promise.all([
    User.findById(userId).select("name email").lean(),
    BusinessProfile.findOne({ userId }).lean(),
  ]);

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const u = user as { name?: string; email?: string };
  const b = business as {
    businessName?: string;
    phone?: string;
    businessAddress?: string;
    gstNumber?: string;
    gstState?: string;
  } | null;

  const data: AutofillData = {
    businessName: b?.businessName ?? null,
    email: u?.email ?? null,
    phone: b?.phone ?? null,
    address: b?.businessAddress ?? null,
    gstNumber: b?.gstNumber ?? null,
    gstState: b?.gstState ?? null,
    ownerName: u?.name ?? null,
  };

  try {
    const redis = getRedis();
    await redis.set(cacheKey, JSON.stringify(data), { ex: CACHE_TTL });
  } catch {
    // silent
  }

  return NextResponse.json({ data });
}
