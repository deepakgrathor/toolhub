import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/require-auth";
import { ApiResponse } from "@/lib/api-response";
// TODO: migrate remaining NextResponse.json calls to ApiResponse helpers
import { connectDB, ToolOutput } from "@toolhub/db";
import mongoose from "mongoose";
import { TOOL_NAME_MAP } from "@/lib/tool-names";
import { getHistoryDays } from "@/lib/plan-limits";

export async function GET(req: NextRequest) {
  const authResult = await requireAuth();
  if (!authResult.authenticated) return authResult.response;
  const { userId } = authResult;

  const historyDays = await getHistoryDays(userId);

  if (historyDays === 0) {
    return NextResponse.json({
      outputs: [],
      total: 0,
      page: 1,
      totalPages: 0,
      planLimit: 0,
      upgradeRequired: true,
    });
  }

  const { searchParams } = req.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(
    50,
    Math.max(1, parseInt(searchParams.get("limit") ?? "10", 10))
  );
  const skip = (page - 1) * limit;

  await connectDB();

  const userObjectId = new mongoose.Types.ObjectId(userId);
  const cutoff =
    historyDays === -1
      ? null
      : new Date(Date.now() - historyDays * 86400000);
  const dateFilter = cutoff
    ? { userId: userObjectId, createdAt: { $gte: cutoff } }
    : { userId: userObjectId };

  const [outputs, total] = await Promise.all([
    ToolOutput.find(dateFilter)
      .select("toolSlug creditsUsed createdAt outputText")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    ToolOutput.countDocuments(dateFilter),
  ]);

  const items = outputs.map((o) => {
    const isImage = o.toolSlug === "thumbnail-ai";
    const rawText = o.outputText ?? "";
    const isHtml =
      rawText.trimStart().startsWith("<!DOCTYPE") ||
      rawText.trimStart().startsWith("<html");
    const previewText = isHtml
      ? rawText.replace(/<[^>]*>/g, "").slice(0, 50).trim()
      : rawText.slice(0, 50).trim();

    return {
      _id: o._id,
      toolSlug: o.toolSlug,
      toolName: TOOL_NAME_MAP[o.toolSlug] ?? o.toolSlug,
      outputPreview: isImage ? "Image generated" : previewText,
      outputText: o.outputText?.slice(0, 200) ?? "",
      hasMore: (o.outputText?.length ?? 0) > 200,
      creditsUsed: o.creditsUsed,
      createdAt: o.createdAt,
    };
  });

  return NextResponse.json({
    outputs: items,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    planLimit: historyDays,
    upgradeRequired: false,
  });
}
