import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB, User, BusinessProfile } from "@toolhub/db";
import { calculateProfileScore } from "@/lib/profile-score";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const [user, business] = await Promise.all([
    User.findById(session.user.id).lean(),
    BusinessProfile.findOne({ userId: session.user.id }).lean(),
  ]);

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const score = calculateProfileScore(user, business);

  return NextResponse.json({ user, business, score });
}
