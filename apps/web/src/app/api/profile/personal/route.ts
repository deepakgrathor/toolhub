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
    name?: string;
    mobile?: string;
    address?: string;
    profession?: string;
  };

  const { name, mobile, address, profession } = body;

  await connectDB();

  const updatedUser = await User.findByIdAndUpdate(
    session.user.id,
    { ...(name && { name }), ...(mobile !== undefined && { mobile }), ...(address !== undefined && { address }), ...(profession && { profession }) },
    { new: true }
  ).lean();

  if (!updatedUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const business = await BusinessProfile.findOne({ userId: session.user.id }).lean();
  const score = calculateProfileScore(updatedUser, business);

  await User.findByIdAndUpdate(session.user.id, { profileScore: score });

  try {
    const redis = getRedis();
    await redis.del(`autofill:${session.user.id}`);
  } catch {
    // silent
  }

  return NextResponse.json({ ok: true, score });
}
