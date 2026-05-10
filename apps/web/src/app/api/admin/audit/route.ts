import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { connectDB, AuditLog } from "@toolhub/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = req.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = 50;
  const skip = (page - 1) * limit;
  const action = searchParams.get("action") ?? "";

  await connectDB();

  const filter = action ? { action } : {};

  const [logs, total] = await Promise.all([
    AuditLog.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("adminId", "name email")
      .lean(),
    AuditLog.countDocuments(filter),
  ]);

  const entries = logs.map((l) => ({
    _id: l._id.toString(),
    action: l.action,
    target: l.target,
    after: l.after,
    admin: (l.adminId as { name?: string; email?: string })?.name ?? "Unknown",
    createdAt: l.createdAt,
  }));

  return NextResponse.json({
    logs: entries,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}
