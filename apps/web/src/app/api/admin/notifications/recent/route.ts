import { NextRequest, NextResponse } from "next/server";
import { connectDB, Notification } from "@toolhub/db";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await connectDB();

  const recent = await Notification.find({ type: "admin_push" })
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

  return NextResponse.json({ notifications: recent });
}
