import { NextRequest, NextResponse } from "next/server";
import { connectDB, User } from "@toolhub/db";
import { requireAdmin } from "@/lib/admin-auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const admin = await requireAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { userId } = await params;
  await connectDB();

  const user = await User.findByIdAndUpdate(
    userId,
    { isDeleted: false, deletedAt: null, status: "active" },
    { new: true }
  ).lean();

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  return NextResponse.json({ ok: true });
}
