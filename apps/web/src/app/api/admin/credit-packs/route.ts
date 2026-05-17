import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { connectDB, CreditPack, AuditLog } from "@toolhub/db";
import { getRedis } from "@toolhub/shared";
import { z } from "zod";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  name: z.string().min(1).max(100),
  credits: z.number().int().min(1),
  price: z.number().min(0),
  pricePerCredit: z.number().min(0).optional(),
  savingsPercent: z.number().min(0).max(100).default(0),
  tagline: z.string().max(200).default(""),
  isPopular: z.boolean().default(false),
  isActive: z.boolean().default(true),
  order: z.number().int().min(0).default(0),
});

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  await connectDB();

  const data = {
    ...parsed.data,
    pricePerCredit:
      parsed.data.pricePerCredit ??
      (parsed.data.credits > 0
        ? parseFloat((parsed.data.price / parsed.data.credits).toFixed(2))
        : 0),
  };

  const pack = await CreditPack.create(data);

  try {
    const redis = getRedis();
    await redis.del("credit-packs:public");
  } catch {
    // silent
  }

  await AuditLog.create({
    adminId: admin.userId,
    action: "create_credit_pack",
    target: `pack:${pack._id}`,
    before: null,
    after: { name: pack.name, credits: pack.credits, price: pack.price },
  });

  return NextResponse.json({ success: true, pack }, { status: 201 });
}
