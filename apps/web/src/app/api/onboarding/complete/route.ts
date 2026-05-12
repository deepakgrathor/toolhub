import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB, User, BusinessProfile } from "@toolhub/db";
import { getRedis } from "@toolhub/shared";
import { getRecommendedTools } from "@/lib/recommendations";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json() as {
    professions?: string[];
    profession?: string;   // legacy single-value fallback
    teamSize?: string;
    challenge?: string;
    kitName: string;
  };

  const { teamSize, challenge, kitName } = body;

  // Normalise: accept new `professions` array or fall back to legacy `profession`
  const professions: string[] =
    Array.isArray(body.professions) && body.professions.length > 0
      ? body.professions
      : body.profession
      ? [body.profession]
      : [];

  if (professions.length === 0 || !kitName) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  await connectDB();

  const recommendedTools = getRecommendedTools({ professions, teamSize, challenge });

  await User.findByIdAndUpdate(session.user.id, {
    profession: professions[0],  // keep legacy field = primary profession
    professions,
    kitName,
    onboardingCompleted: true,
    onboardingStep: 4,
    selectedTools: recommendedTools,
  });

  await BusinessProfile.findOneAndUpdate(
    { userId: session.user.id },
    { userId: session.user.id, teamSize: teamSize ?? null },
    { upsert: true, new: true }
  );

  // Invalidate user + workspace cache
  try {
    const redis = getRedis();
    await Promise.all([
      redis.del(`SetuLix:user:${session.user.id}`),
      redis.del(`workspace:${session.user.id}`),
    ]);
  } catch {
    // silent
  }

  return NextResponse.json({ success: true, updateSession: true });
}
