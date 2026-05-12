import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB, User } from "@toolhub/db";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json() as { step: number; data: Record<string, unknown> };
  const { step } = body;

  if (!step || typeof step !== "number") {
    return NextResponse.json({ error: "Invalid step" }, { status: 400 });
  }

  await connectDB();
  await User.findByIdAndUpdate(session.user.id, { onboardingStep: step });

  return NextResponse.json({ ok: true });
}
