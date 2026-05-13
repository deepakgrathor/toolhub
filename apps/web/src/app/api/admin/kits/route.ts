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

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    await connectDB();
    const { Tool } = await import("@toolhub/db");

    const kits = await Kit.find().sort({ order: 1 }).lean();

    // Count tools per kit
    const counts = await Tool.aggregate([
      { $group: { _id: "$kitSlug", count: { $sum: 1 } } },
    ]);
    const countMap = new Map(counts.map((c: { _id: string; count: number }) => [c._id, c.count]));

    const result = kits.map(k => ({
      ...k,
      toolCount: countMap.get((k as { slug: string }).slug) ?? 0,
    }));

    return NextResponse.json({ kits: result });
  } catch (err) {
    console.error("[GET /api/admin/kits]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    await connectDB();
    const body = await req.json() as {
      slug: string;
      name: string;
      description?: string;
      icon?: string;
      color?: string;
      order?: number;
      isActive?: boolean;
      showInOnboarding?: boolean;
      onboardingLabel?: string;
      onboardingDescription?: string;
      onboardingIcon?: string;
    };

    if (!body.slug || !body.name) {
      return NextResponse.json({ error: "slug and name are required" }, { status: 400 });
    }

    const kit = await Kit.create(body);

    await AuditLog.create({
      action: "kit_created",
      targetType: "kit",
      targetId: String(kit._id),
      details: { slug: kit.slug, name: kit.name },
    });

    await invalidateKitCache();
    return NextResponse.json({ kit }, { status: 201 });
  } catch (err: unknown) {
    if ((err as { code?: number }).code === 11000) {
      return NextResponse.json({ error: "Kit slug already exists" }, { status: 409 });
    }
    console.error("[POST /api/admin/kits]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
