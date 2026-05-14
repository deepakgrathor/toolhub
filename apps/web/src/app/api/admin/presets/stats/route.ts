import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { connectDB, Preset } from "@toolhub/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await connectDB();

  const [totalPresets, topToolsAgg, usersAgg] = await Promise.all([
    Preset.countDocuments(),
    Preset.aggregate([
      { $group: { _id: "$toolSlug", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      { $project: { _id: 0, toolSlug: "$_id", count: 1 } },
    ]),
    Preset.aggregate([
      { $group: { _id: "$userId", presetCount: { $sum: 1 } } },
      {
        $group: {
          _id: null,
          usersWithPresets: { $sum: 1 },
          totalPresets: { $sum: "$presetCount" },
        },
      },
    ]),
  ]);

  const usersWithPresets: number = usersAgg[0]?.usersWithPresets ?? 0;
  const avgPresetsPerUser: number =
    usersWithPresets > 0
      ? Math.round((usersAgg[0].totalPresets / usersWithPresets) * 10) / 10
      : 0;

  return NextResponse.json({
    totalPresets,
    usersWithPresets,
    topTools: topToolsAgg as { toolSlug: string; count: number }[],
    avgPresetsPerUser,
  });
}
