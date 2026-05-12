import { NextRequest, NextResponse } from "next/server";
import { connectDB, Referral } from "@toolhub/db";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await connectDB();

  const { searchParams } = req.nextUrl;
  const status = searchParams.get("status");
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = 20;
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = {};
  if (status && status !== "all") filter.status = status;

  const [referrals, total] = await Promise.all([
    Referral.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("referrerId", "name email")
      .populate("referredId", "name email")
      .lean(),
    Referral.countDocuments(filter),
  ]);

  return NextResponse.json({ referrals, total, page, pages: Math.ceil(total / limit) });
}
