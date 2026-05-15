import { NextResponse } from "next/server";
import { connectDB } from "@toolhub/db";
import mongoose from "mongoose";
import { withCache } from "@/lib/with-cache";

export async function GET() {
  try {
    const tools = await withCache("public:tools", 300, async () => {
      await connectDB();
      const db = mongoose.connection.db!;
      return db
        .collection("tools")
        .find({ isVisible: { $ne: false } })
        .project({ slug: 1, name: 1, kit: 1, description: 1 })
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
