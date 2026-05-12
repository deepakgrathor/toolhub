import { NextRequest, NextResponse } from "next/server";
import { connectDB, Referral } from "@toolhub/db";
import { requireAdmin } from "@/lib/admin-auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  await connectDB();

  const referral = await Referral.findById(id);
  if (!referral) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (referral.status === "completed") {
    return NextResponse.json({ error: "Cannot reject a completed referral" }, { status: 400 });
  }

  await Referral.findByIdAndDelete(id);

  return NextResponse.json({ success: true });
}
