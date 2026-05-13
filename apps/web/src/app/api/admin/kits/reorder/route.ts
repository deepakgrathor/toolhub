import { NextRequest, NextResponse } from "next/server";
import { connectDB, Kit } from "@toolhub/db";
import { getRedis } from "@toolhub/shared";
import { requireAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    await connectDB();
    const { order } = await req.json() as { order: Array<{ slug: string; order: number }> };

    if (!Array.isArray(order)) {
      return NextResponse.json({ error: "order array required" }, { status: 400 });
    }

    await Promise.all(
      order.map(({ slug, order: ord }) =>
        Kit.updateOne({ slug }, { $set: { order: ord } })
      )
    );

    try {
      const redis = getRedis();
      await redis.del("kits:public");
    } catch {
      // silent
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[PATCH /api/admin/kits/reorder]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
