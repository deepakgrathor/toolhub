import { NextRequest, NextResponse } from "next/server";
import { connectDB, Tool, ToolConfig, AuditLog } from "@toolhub/db";
import { getRedis } from "@toolhub/shared";
import { requireAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

async function invalidateToolCache(slug: string) {
  try {
    const redis = getRedis();
    await Promise.all([
      redis.del(`tool:config:${slug}`),
      redis.del("kits:public"),
      redis.del("registry:all_tools"),
      redis.del(`registry:tool:${slug}`),
    ]);
  } catch {
    // silent
  }
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    await connectDB();
    const body = await req.json() as {
      slug: string;
      name: string;
      description?: string;
      category?: string;
      kits?: string[];
      kitSlug?: string;
      type?: string;
      icon?: string;
      color?: string;
      tags?: string[];
      aiModel?: string;
      systemPrompt?: string;
      promptTemplate?: string;
      formFields?: object[];
      outputType?: string;
      outputLabel?: string;
      maxOutputTokens?: number;
      temperature?: number;
      dailyLimit?: number;
      creditCost?: number;
      requiredPlan?: string;
      isActive?: boolean;
      isVisible?: boolean;
    };

    if (!body.slug || !body.name) {
      return NextResponse.json({ error: "slug and name are required" }, { status: 400 });
    }

    // Create Tool document
    const { creditCost, isActive, isVisible, ...toolData } = body;

    const tool = await Tool.create({
      ...toolData,
      category: toolData.kitSlug ?? "general",
      kits: toolData.kitSlug ? [toolData.kitSlug] : [],
      isAI: toolData.type !== "client-side",
      isFree: (creditCost ?? 0) === 0,
      description: toolData.description ?? "",
    });

    // Create ToolConfig
    await ToolConfig.findOneAndUpdate(
      { toolSlug: body.slug },
      {
        $set: {
          toolSlug: body.slug,
          creditCost: creditCost ?? 0,
          isActive: isActive ?? true,
          isVisible: isVisible ?? true,
          aiModel: body.aiModel ?? "gemini-flash-2.0",
          aiProvider: "google",
        },
      },
      { upsert: true }
    );

    await AuditLog.create({
      action: "tool_created",
      targetType: "tool",
      targetId: String(tool._id),
      details: { slug: body.slug, name: body.name, createdBy: admin.email },
    });

    await invalidateToolCache(body.slug);
    return NextResponse.json({ tool }, { status: 201 });
  } catch (err: unknown) {
    if ((err as { code?: number }).code === 11000) {
      return NextResponse.json({ error: "Tool slug already exists" }, { status: 409 });
    }
    console.error("[POST /api/admin/tools]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
