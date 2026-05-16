import { NextResponse } from "next/server";
import { connectDB } from "@toolhub/db";
import mongoose from "mongoose";
import { withCache } from "@/lib/with-cache";

export async function GET() {
  try {
    const tools = await withCache("public:tools:v2", 300, async () => {
      await connectDB();
      const db = mongoose.connection.db!;
      return db
        .collection("tools")
        .aggregate([
          { $match: { isVisible: { $ne: false } } },
          {
            $lookup: {
              from: "toolconfigs",
              localField: "slug",
              foreignField: "toolSlug",
              as: "configArr",
            },
          },
          {
            $addFields: {
              creditCost: {
                $ifNull: [{ $arrayElemAt: ["$configArr.creditCost", 0] }, 0],
              },
              isFree: {
                $eq: [
                  { $ifNull: [{ $arrayElemAt: ["$configArr.creditCost", 0] }, 0] },
                  0,
                ],
              },
            },
          },
          {
            $project: { slug: 1, name: 1, kit: 1, description: 1, creditCost: 1, isFree: 1 },
          },
        ])
        .toArray();
    });

    const response = NextResponse.json({ tools });
    response.headers.set(
      "Cache-Control",
      "public, s-maxage=3600, stale-while-revalidate=86400"
    );
    return response;
  } catch {
    return NextResponse.json(
      { tools: [], error: "DB unavailable" },
      { status: 200 }
    );
  }
}
