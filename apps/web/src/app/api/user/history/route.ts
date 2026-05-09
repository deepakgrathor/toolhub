import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB, ToolOutput } from "@toolhub/db";
import mongoose from "mongoose";
import { TOOL_NAME_MAP } from "@/lib/tool-names";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "10", 10)));
  const skip = (page - 1) * limit;

  await connectDB();

  const userId = new mongoose.Types.ObjectId(session.user.id);

  const [outputs, total] = await Promise.all([
    ToolOutput.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    ToolOutput.countDocuments({ userId }),
  ]);

  const enriched = outputs.map((o) => ({
    _id: o._id,
    toolSlug: o.toolSlug,
    toolName: TOOL_NAME_MAP[o.toolSlug] ?? o.toolSlug,
    outputPreview:
      o.toolSlug === "thumbnail-ai"
        ? "Image generated"
        : (o.outputText ?? "").slice(0, 60).trim(),
    creditsUsed: o.creditsUsed,
    createdAt: o.createdAt,
  }));

  return NextResponse.json({
    outputs: enriched,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}
