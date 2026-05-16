import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { connectDB, Plan, AuditLog } from "@toolhub/db";
import { getRedis } from "@toolhub/shared";
import { z } from "zod";

export const dynamic = "force-dynamic";

const featureSchema = z.object({
  text: z.string().min(1),
  included: z.boolean().default(true),
  highlight: z
    .union([z.boolean(), z.string()])
    .transform((v) => (typeof v === "boolean" ? "" : v))
    .default(""),
});

const pricingSchema = z.object({
  basePrice: z.number().min(0).optional(),
  pricePerCredit: z.number().min(0).optional(),
  baseCredits: z.number().min(0).optional(),
  maxCredits: z.number().min(0).optional(),
  discountPercent: z.number().min(0).max(100).optional(),
  cashfreePlanId: z.string().optional(),
});

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  tagline: z.string().max(200).optional(),
  isActive: z.boolean().optional(),
  isPopular: z.boolean().optional(),
  order: z.number().int().min(0).optional(),
  pricing: z
    .object({
      monthly: pricingSchema.optional(),
      yearly: pricingSchema.optional(),
    })
    .optional(),
  features: z.array(featureSchema).optional(),
  limits: z
    .object({
      toolAccess: z.enum(["free_only", "all"]).optional(),
      historyDays: z.number().int().optional(),
      teamSeats: z.number().int().min(1).optional(),
    })
    .optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { slug: string } },
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
      { status: 400 },
    );
  }

  await connectDB();

  const before = await Plan.findOne({ slug: params.slug }).lean();
  if (!before) {
    return NextResponse.json({ error: "Plan not found" }, { status: 404 });
  }

  // Build flat update using dot notation for nested pricing fields
  const updateSet: Record<string, unknown> = {};
  const data = parsed.data;
  if (data.name !== undefined) updateSet.name = data.name;
  if (data.tagline !== undefined) updateSet.tagline = data.tagline;
  if (data.isActive !== undefined) updateSet.isActive = data.isActive;
  if (data.isPopular !== undefined) updateSet.isPopular = data.isPopular;
  if (data.order !== undefined) updateSet.order = data.order;
  if (data.features !== undefined) updateSet.features = data.features;
  if (data.limits) {
    const l = data.limits;
    if (l.toolAccess !== undefined)
      updateSet["limits.toolAccess"] = l.toolAccess;
    if (l.historyDays !== undefined)
      updateSet["limits.historyDays"] = l.historyDays;
    if (l.teamSeats !== undefined) updateSet["limits.teamSeats"] = l.teamSeats;
  }
  if (data.pricing?.monthly) {
    const m = data.pricing.monthly;
    if (m.basePrice !== undefined)
      updateSet["pricing.monthly.basePrice"] = m.basePrice;
    if (m.pricePerCredit !== undefined)
      updateSet["pricing.monthly.pricePerCredit"] = m.pricePerCredit;
    if (m.baseCredits !== undefined)
      updateSet["pricing.monthly.baseCredits"] = m.baseCredits;
    if (m.maxCredits !== undefined)
      updateSet["pricing.monthly.maxCredits"] = m.maxCredits;
    if (m.cashfreePlanId !== undefined)
      updateSet["pricing.monthly.cashfreePlanId"] = m.cashfreePlanId;
  }
  if (data.pricing?.yearly) {
    const y = data.pricing.yearly;
    if (y.basePrice !== undefined)
      updateSet["pricing.yearly.basePrice"] = y.basePrice;
    if (y.pricePerCredit !== undefined)
      updateSet["pricing.yearly.pricePerCredit"] = y.pricePerCredit;
    if (y.baseCredits !== undefined)
      updateSet["pricing.yearly.baseCredits"] = y.baseCredits;
    if (y.maxCredits !== undefined)
      updateSet["pricing.yearly.maxCredits"] = y.maxCredits;
    if (y.discountPercent !== undefined)
      updateSet["pricing.yearly.discountPercent"] = y.discountPercent;
    if (y.cashfreePlanId !== undefined)
      updateSet["pricing.yearly.cashfreePlanId"] = y.cashfreePlanId;
  }

  const plan = await Plan.findOneAndUpdate(
    { slug: params.slug },
    { $set: updateSet },
    { new: true },
  ).lean();

  // Invalidate public cache
  try {
    const redis = getRedis();
    await redis.del("plans:public");
  } catch {
    // silent
  }

  await AuditLog.create({
    adminId: admin.userId,
    action: "update_plan",
    target: `plan:${params.slug}`,
    before: {
      name: before.name,
      isActive: before.isActive,
      isPopular: before.isPopular,
    },
    after: parsed.data,
  });

  return NextResponse.json({ success: true, plan });
}
