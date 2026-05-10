import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { connectDB, CreditPack, AuditLog } from "@toolhub/db";
import { z } from "zod";

export const dynamic = "force-dynamic";

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  credits: z.number().int().min(1).optional(),
  priceInr: z.number().min(0).optional(),
  isFeatured: z.boolean().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
  razorpayPlanId: z.string().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = await requireAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  await connectDB();

  const before = await CreditPack.findById(params.id).lean();
  if (!before) {
    return NextResponse.json({ error: "Pack not found" }, { status: 404 });
  }

  const pack = await CreditPack.findByIdAndUpdate(
    params.id,
    { $set: parsed.data },
    { new: true }
  ).lean();

  await AuditLog.create({
    adminId: admin.userId,
    action: "update_credit_pack",
    target: `pack:${params.id}`,
    before: {
      name: before.name,
      credits: before.credits,
      priceInr: before.priceInr,
      isFeatured: before.isFeatured,
      isActive: before.isActive,
      sortOrder: before.sortOrder,
    },
    after: parsed.data,
  });

  return NextResponse.json({ success: true, pack });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = await requireAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await connectDB();

  const pack = await CreditPack.findByIdAndDelete(params.id).lean();
  if (!pack) {
    return NextResponse.json({ error: "Pack not found" }, { status: 404 });
  }

  await AuditLog.create({
    adminId: admin.userId,
    action: "delete_credit_pack",
    target: `pack:${params.id}`,
    before: {
      name: pack.name,
      credits: pack.credits,
      priceInr: pack.priceInr,
    },
    after: null,
  });

  return NextResponse.json({ success: true });
}
