import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { connectDB, Preset } from "@toolhub/db";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: { userId: string } }
) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId } = params;
  await connectDB();

  const byToolAgg = await Preset.aggregate([
    { $match: { userId } },
    {
      $group: {
        _id: "$toolSlug",
        count: { $sum: 1 },
        hasDefault: { $max: { $cond: ["$isDefault", 1, 0] } },
      },
    },
    { $sort: { count: -1 } },
    {
      $project: {
        _id: 0,
        toolSlug: "$_id",
        count: 1,
        hasDefault: { $eq: ["$hasDefault", 1] },
      },
    },
  ]);

  const totalPresets = byToolAgg.reduce(
    (sum: number, t: { count: number }) => sum + t.count,
    0
  );

  return NextResponse.json({
    totalPresets,
    byTool: byToolAgg as { toolSlug: string; count: number; hasDefault: boolean }[],
  });
}
