import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB, User } from "@toolhub/db";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await req.json() as { slug: string };
  if (!slug) return NextResponse.json({ error: "slug required" }, { status: 400 });

  await connectDB();
  await User.findByIdAndUpdate(session.user.id, {
    $addToSet: { selectedTools: slug },
  });

  return NextResponse.json({ ok: true });
}
