import { NextRequest, NextResponse } from "next/server";
import { connectDB, Kit, AuditLog } from "@toolhub/db";
import { getRedis } from "@toolhub/shared";
import { requireAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

async function invalidateKitCache() {
  try {
    const redis = getRedis();
    await redis.del("kits:public");
  } catch {
    // silent
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    await connectDB();
    const body = await req.json() as Record<string, unknown>;

    // Prevent changing the slug via PATCH
    delete body.slug;

    const kit = await Kit.findOneAndUpdate(
      { slug: params.slug },
      { $set: body },
      { new: true }
    );

    if (!kit) {
      return NextResponse.json({ error: "Kit not found" }, { status: 404 });
    }

    await AuditLog.create({
      action: "kit_updated",
      targetType: "kit",
      targetId: String(kit._id),
      details: { slug: kit.slug, changes: Object.keys(body) },
    });

    await invalidateKitCache();
    return NextResponse.json({ kit });
  } catch (err) {
    console.error("[PATCH /api/admin/kits/[slug]]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    await connectDB();

    // Soft delete — set isActive: false
    const kit = await Kit.findOneAndUpdate(
      { slug: params.slug },
      { $set: { isActive: false } },
      { new: true }
    );

    if (!kit) {
      return NextResponse.json({ error: "Kit not found" }, { status: 404 });
    }

    await AuditLog.create({
      action: "kit_deactivated",
      targetType: "kit",
      targetId: String(kit._id),
      details: { slug: kit.slug },
    });

    await invalidateKitCache();
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/admin/kits/[slug]]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
