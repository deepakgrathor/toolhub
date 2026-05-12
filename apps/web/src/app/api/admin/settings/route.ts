import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { connectDB, SiteConfig, AuditLog } from "@toolhub/db";
import { getRedis } from "@toolhub/shared";
import { z } from "zod";

export const dynamic = "force-dynamic";

const settingsSchema = z.object({
  default_theme: z.enum(["dark", "light"]).optional(),
  announcement_banner: z.string().max(500).optional(),
  announcement_visible: z.boolean().optional(),
  maintenance_mode: z.boolean().optional(),
  credit_rollover_enabled: z.boolean().optional(),
  credit_rollover_days: z.number().int().min(1).max(365).optional(),
});

export async function PATCH(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = settingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  await connectDB();

  const updates = parsed.data;
  const keys = Object.keys(updates) as (keyof typeof updates)[];

  const before: Record<string, unknown> = {};
  const after: Record<string, unknown> = {};

  await Promise.all(
    keys.map(async (key) => {
      const existing = await SiteConfig.findOne({ key }).lean();
      before[key] = existing?.value ?? null;
      after[key] = updates[key];

      await SiteConfig.findOneAndUpdate(
        { key },
        { $set: { value: updates[key] } },
        { upsert: true, new: true }
      );
    })
  );

  await AuditLog.create({
    adminId: admin.userId,
    action: "update_site_settings",
    target: "site_config",
    before,
    after,
  });

  try {
    const redis = getRedis();
    const invalidations: Promise<unknown>[] = [];

    if ("maintenance_mode" in updates) {
      invalidations.push(
        redis.set("site:maintenance_mode", updates.maintenance_mode ? "1" : "0")
      );
    }
    if ("credit_rollover_enabled" in updates || "credit_rollover_days" in updates) {
      invalidations.push(redis.del("site-config:rollover"));
    }

    await Promise.allSettled(invalidations);
  } catch {
    // Redis unavailable — non-blocking
  }

  return NextResponse.json({ success: true });
}
