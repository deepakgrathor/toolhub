import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB, User, BusinessProfile } from "@toolhub/db";
import { uploadToR2 } from "@/lib/r2-upload";
import { calculateProfileScore } from "@/lib/profile-score";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (file.size > 2 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large (max 2MB)" }, { status: 400 });
  }

  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Only image files allowed" }, { status: 400 });
  }

  try {
    const url = await uploadToR2(file, "logos");

    await connectDB();
    const business = await BusinessProfile.findOneAndUpdate(
      { userId: session.user.id },
      { logo: url, userId: session.user.id },
      { upsert: true, new: true }
    ).lean();

    const user = await User.findById(session.user.id).lean();
    const score = calculateProfileScore(user!, business);
    await User.findByIdAndUpdate(session.user.id, { profileScore: score });

    return NextResponse.json({ ok: true, url, score });
  } catch (err) {
    console.error("[profile/logo]", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
