import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB, User, BusinessProfile } from "@toolhub/db";
import { calculateProfileScore } from "@/lib/profile-score";
import { getRedis } from "@toolhub/shared";

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json() as {
    businessName?: string;
    businessType?: string;
    industry?: string;
    gstNumber?: string;
    gstState?: string;
    website?: string;
    teamSize?: string;
    phone?: string;
    businessAddress?: string;
  };

  await connectDB();

  const updatedBusiness = await BusinessProfile.findOneAndUpdate(
    { userId: session.user.id },
    { ...body, userId: session.user.id },
    { upsert: true, new: true }
  ).lean();

  const user = await User.findById(session.user.id).lean();
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const score = calculateProfileScore(user, updatedBusiness);
  await User.findByIdAndUpdate(session.user.id, { profileScore: score });

  try {
    const redis = getRedis();
    await redis.del(`autofill:${session.user.id}`);
  } catch {
    // silent
  }

  return NextResponse.json({ ok: true, score });
}
