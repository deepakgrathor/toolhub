import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB, Tool, ToolConfig, Kit } from "@toolhub/db";
import { getRedis } from "@toolhub/shared";

export const dynamic = "force-dynamic";

const TTL = 5 * 60; // 5 min

export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const cacheKey = `tool:config:${params.slug}`;

    // Redis cache
    try {
      const redis = getRedis();
      const cached = await redis.get(cacheKey);
      if (cached) return NextResponse.json(cached);
    } catch {
      // continue
    }

    await connectDB();

    const [tool, config] = await Promise.all([
      Tool.findOne({ slug: params.slug }).lean(),
      ToolConfig.findOne({ toolSlug: params.slug }).lean(),
    ]);

    if (!tool) {
      return NextResponse.json({ error: "Tool not found" }, { status: 404 });
    }

    if (config?.isVisible === false) {
      return NextResponse.json({ error: "Tool not found" }, { status: 404 });
    }

    if (config?.isActive === false) {
      return NextResponse.json({ isActive: false, slug: params.slug, name: tool.name });
    }

    // Resolve kit name
    let kitName = "";
    if (tool.kitSlug) {
      const kit = await Kit.findOne({ slug: tool.kitSlug }).select("name").lean();
      kitName = (kit as { name?: string } | null)?.name ?? "";
    }

    // Safe fields — never include systemPrompt or promptTemplate
    const response = {
      slug:        tool.slug,
      name:        tool.name,
      description: tool.description,
      icon:        tool.icon,
      color:       (tool as unknown as { color?: string }).color ?? "#7c3aed",
      kitSlug:     (tool as unknown as { kitSlug?: string }).kitSlug ?? "",
      kitName,
      creditCost:  config?.creditCost ?? 0,
      isActive:    config?.isActive ?? true,
      type:        (tool as unknown as { type?: string }).type ?? "ai",
      outputType:  (tool as unknown as { outputType?: string }).outputType ?? "text",
      outputLabel: (tool as unknown as { outputLabel?: string }).outputLabel ?? "Generated Output",
      formFields:  (tool as unknown as { formFields?: unknown[] }).formFields ?? [],
      aiModel:     (tool as unknown as { aiModel?: string }).aiModel ?? "",
      dailyLimit:  (tool as unknown as { dailyLimit?: number }).dailyLimit ?? 0,
      requiredPlan:(tool as unknown as { requiredPlan?: string }).requiredPlan ?? "free",
    };

    // Cache
    try {
      const redis = getRedis();
      await redis.set(cacheKey, response, { ex: TTL });
    } catch {
      // silent
    }

    return NextResponse.json(response);
  } catch (err) {
    console.error("[GET /api/tools/[slug]/config]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
