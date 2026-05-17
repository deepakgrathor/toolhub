import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { connectDB, SiteConfig, AuditLog } from "@toolhub/db";
import { invalidateSiteConfigCache } from "@/lib/site-config-cache";
import { z } from "zod";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await connectDB();
  const configs = await SiteConfig.find()
    .sort({ key: 1 })
    .lean();

  return NextResponse.json({
    configs: configs.map((c) => ({
      key: c.key,
      value: c.value,
      updatedAt: c.updatedAt,
    })),
  });
}

const patchSchema = z.object({
  key: z.string().min(1).max(100).regex(/^[a-z][a-z0-9_]*$/, "Key must be snake_case"),
  value: z.union([z.string(), z.number(), z.boolean()]),
});

export async function PATCH(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Validation failed" },
      { status: 400 }
    );
  }

  const { key, value } = parsed.data;

  await connectDB();

  const existing = await SiteConfig.findOne({ key }).lean();
  const beforeValue = existing?.value ?? null;

  await SiteConfig.findOneAndUpdate(
    { key },
    { $set: { value } },
    { upsert: true, new: true }
  );

  await invalidateSiteConfigCache(key);

  await AuditLog.create({
    adminId: admin.userId,
    action: "update_site_config",
    target: key,
    before: { [key]: beforeValue },
    after: { [key]: value },
  });

  return NextResponse.json({ success: true });
}
