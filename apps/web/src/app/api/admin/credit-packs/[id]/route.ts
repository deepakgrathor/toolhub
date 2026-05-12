import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { connectDB, CreditPack, AuditLog } from "@toolhub/db";
import { getRedis } from "@toolhub/shared";
import { z } from "zod";

export const dynamic = "force-dynamic";

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  credits: z.number().int().min(1).optional(),
  price: z.number().min(0).optional(),
  pricePerCredit: z.number().min(0).optional(),
  isPopular: z.boolean().optional(),
  isActive: z.boolean().optional(),
  order: z.number().int().min(0).optional(),
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

  try {
    const redis = getRedis();
    await redis.del("credit-packs:public");
  } catch {
    // silent
  }

  await AuditLog.create({
    adminId: admin.userId,
    action: "update_credit_pack",
    target: `pack:${params.id}`,
    before: {
      name: before.name,
      credits: before.credits,
      price: before.price,
      isPopular: before.isPopular,
      isActive: before.isActive,
      order: before.order,
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

  try {
    const redis = getRedis();
    await redis.del("credit-packs:public");
  } catch {
    // silent
  }

  await AuditLog.create({
    adminId: admin.userId,
    action: "delete_credit_pack",
    target: `pack:${params.id}`,
    before: { name: pack.name, credits: pack.credits, price: pack.price },
    after: null,
  });

  return NextResponse.json({ success: true });
}
