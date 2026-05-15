import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB, User, BusinessProfile } from "@toolhub/db";
import { uploadToR2 } from "@/lib/r2-upload";
import { calculateProfileScore } from "@/lib/profile-score";
import { validateImageFile } from "@/lib/file-validation";

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

  const validation = await validateImageFile(file);
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  try {
    const url = await uploadToR2(file, "avatars", validation.detectedMime!);

    await connectDB();
    const updatedUser = await User.findByIdAndUpdate(
      session.user.id,
      { avatar: url },
      { new: true }
    ).lean();

    const business = await BusinessProfile.findOne({ userId: session.user.id }).lean();
    const score = calculateProfileScore(updatedUser!, business);
    await User.findByIdAndUpdate(session.user.id, { profileScore: score });

    return NextResponse.json({ ok: true, url, score });
  } catch (err) {
    console.error("[profile/avatar]", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
