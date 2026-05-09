import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB, ToolOutput } from "@toolhub/db";
import mongoose from "mongoose";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = 9;
  const skip = (page - 1) * limit;

  await connectDB();

  const userId = new mongoose.Types.ObjectId(session.user.id);

  const [outputs, total] = await Promise.all([
    ToolOutput.find({ userId, toolSlug: "thumbnail-ai" })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    ToolOutput.countDocuments({ userId, toolSlug: "thumbnail-ai" }),
  ]);

  const thumbnails = outputs.map((o) => ({
    id: o._id,
    imageUrl: o.outputText,
    prompt: (o.inputSnapshot as Record<string, string>)?.prompt ?? "",
    createdAt: o.createdAt,
  }));

  return NextResponse.json({
    thumbnails,
    total,
    page,
    hasMore: skip + limit < total,
  });
}
