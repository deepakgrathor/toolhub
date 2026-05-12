import { NextRequest, NextResponse } from "next/server";
import { connectDB, Notification } from "@toolhub/db";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await connectDB();

  // Group by title+message+minute-bucket so bulk "all users" sends appear as one row
  const recent = await Notification.aggregate([
    { $match: { type: "admin_push" } },
    {
      $group: {
        _id: {
          title: "$title",
          message: "$message",
          // bucket to nearest minute so same-campaign docs collapse
          minute: { $toLong: { $dateTrunc: { date: "$createdAt", unit: "minute" } } },
        },
        sentAt: { $max: "$createdAt" },
        count: { $sum: 1 },
        title: { $first: "$title" },
        message: { $first: "$message" },
      },
    },
    { $sort: { sentAt: -1 } },
    { $limit: 20 },
  ]);

  return NextResponse.json({ notifications: recent });
}
