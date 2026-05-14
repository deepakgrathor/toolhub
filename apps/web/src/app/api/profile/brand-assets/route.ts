import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB, BusinessProfile } from "@toolhub/db";
import { getRedis } from "@toolhub/shared";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const profile = await BusinessProfile.findOne({ userId: session.user.id }).lean();

  return NextResponse.json({
    logoUrl: profile?.logoUrl ?? null,
    signatureUrl: profile?.signatureUrl ?? null,
    letterheadColor: profile?.letterheadColor ?? "#7c3aed",
    signatoryName: profile?.signatoryName ?? "",
    signatoryDesignation: profile?.signatoryDesignation ?? "",
  });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json() as {
    letterheadColor?: string;
    signatoryName?: string;
    signatoryDesignation?: string;
  };

  const update: Record<string, string> = {};
  if (body.letterheadColor !== undefined) update.letterheadColor = body.letterheadColor;
  if (body.signatoryName !== undefined) update.signatoryName = body.signatoryName;
  if (body.signatoryDesignation !== undefined) update.signatoryDesignation = body.signatoryDesignation;

  await connectDB();
  await BusinessProfile.findOneAndUpdate(
    { userId: session.user.id },
    { ...update, userId: session.user.id },
    { upsert: true, new: true }
  );

  try {
    const redis = getRedis();
    await redis.del(`autofill:${session.user.id}`);
  } catch {
    // silent
  }

  return NextResponse.json({ success: true });
}
