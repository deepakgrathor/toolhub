import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB, ToolOutput } from "@toolhub/db";
import mongoose from "mongoose";
import { TOOL_NAME_MAP } from "@/lib/tool-names";
import { getUserPlan } from "@/lib/user-plan";

const DAY_LIMITS: Record<string, number> = {
  free: 0,
  lite: 30,
  pro: 90,
  business: 365,
  enterprise: 365,
};

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userPlan = await getUserPlan(session.user.id);
  const days = DAY_LIMITS[userPlan] ?? 0;

  if (days === 0) {
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
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "10", 10)));
  const skip = (page - 1) * limit;

  await connectDB();

  const userId = new mongoose.Types.ObjectId(session.user.id);
  const cutoff = new Date(Date.now() - days * 86400000);
  const dateFilter = { userId, createdAt: { $gte: cutoff } };

  const [outputs, total] = await Promise.all([
    ToolOutput.find(dateFilter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    ToolOutput.countDocuments(dateFilter),
  ]);

  const enriched = outputs.map((o) => {
    const isImage = o.toolSlug === "thumbnail-ai";
    const rawText = o.outputText ?? "";
    const isHtml = rawText.trimStart().startsWith("<!DOCTYPE") || rawText.trimStart().startsWith("<html");
    const previewText = isHtml
      ? rawText.replace(/<[^>]*>/g, "").slice(0, 50).trim()
      : rawText.slice(0, 50).trim();

    return {
      _id: o._id,
      toolSlug: o.toolSlug,
      toolName: TOOL_NAME_MAP[o.toolSlug] ?? o.toolSlug,
      outputPreview: isImage ? "Image generated" : previewText,
      outputText: o.outputText ?? "",
      creditsUsed: o.creditsUsed,
      createdAt: o.createdAt,
    };
  });

  return NextResponse.json({
    outputs: enriched,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    planLimit: days,
    upgradeRequired: false,
  });
}
