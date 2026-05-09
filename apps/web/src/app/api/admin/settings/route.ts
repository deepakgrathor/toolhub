import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB, SiteConfig, AuditLog } from "@toolhub/db";
import { getRedis } from "@toolhub/shared";
import { z } from "zod";

export const dynamic = "force-dynamic";

const settingsSchema = z.object({
  default_theme: z.enum(["dark", "light"]).optional(),
  announcement_banner: z.string().max(500).optional(),
  announcement_visible: z.boolean().optional(),
  maintenance_mode: z.boolean().optional(),
});

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") {
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

  // Fetch before-values for audit log
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
    adminId: session.user.id,
    action: "update_site_settings",
    target: "site_config",
    before,
    after,
  });

  // Sync maintenance_mode to Redis so middleware can read it without DB access
  if ("maintenance_mode" in updates) {
    try {
      const redis = getRedis();
      await redis.set("site:maintenance_mode", updates.maintenance_mode ? "1" : "0");
    } catch {
      // Redis unavailable — middleware falls back to false (non-blocking)
    }
  }

  return NextResponse.json({ success: true });
}
