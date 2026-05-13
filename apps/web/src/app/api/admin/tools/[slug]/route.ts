import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { connectDB, Tool, ToolConfig, AuditLog } from "@toolhub/db";
import { z } from "zod";
import { clearToolCache } from "@/lib/tool-registry";

export const dynamic = "force-dynamic";

const KIT_VALUES = ["creator", "sme", "hr", "ca-legal", "marketing"] as const;

const schema = z.object({
  creditCost:      z.number().int().min(0).optional(),
  aiModel:         z.string().optional(),
  aiProvider:      z.string().optional(),
  isActive:        z.boolean().optional(),
  isVisible:       z.boolean().optional(),
  kit:             z.enum(KIT_VALUES).optional(),
  // New dynamic tool fields
  name:            z.string().optional(),
  description:     z.string().optional(),
  icon:            z.string().optional(),
  color:           z.string().optional(),
  type:            z.enum(["ai", "client-side"]).optional(),
  kitSlug:         z.string().optional(),
  systemPrompt:    z.string().optional(),
  promptTemplate:  z.string().optional(),
  formFields:      z.array(z.record(z.unknown())).optional(),
  outputType:      z.enum(["text", "html", "image", "json"]).optional(),
  outputLabel:     z.string().optional(),
  tags:            z.array(z.string()).optional(),
  maxOutputTokens: z.number().optional(),
  temperature:     z.number().optional(),
  dailyLimit:      z.number().optional(),
  requiredPlan:    z.string().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const admin = await requireAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { slug } = params;
  const {
    kit, creditCost, aiModel, aiProvider, isActive, isVisible,
    name, description, icon, color, type, kitSlug,
    systemPrompt, promptTemplate, formFields, outputType, outputLabel,
    tags, maxOutputTokens, temperature, dailyLimit, requiredPlan,
  } = parsed.data;

  await connectDB();

  const before = await ToolConfig.findOne({ toolSlug: slug }).lean();

  // ── Update ToolConfig fields ───────────────────────────────────────────────
  const configUpdate: Record<string, unknown> = {};
  if (creditCost !== undefined) configUpdate.creditCost = creditCost;
  if (aiModel    !== undefined) configUpdate.aiModel    = aiModel;
  if (aiProvider !== undefined) configUpdate.aiProvider = aiProvider;
  if (isActive   !== undefined) configUpdate.isActive   = isActive;
  if (isVisible  !== undefined) configUpdate.isVisible  = isVisible;

  const config = Object.keys(configUpdate).length > 0
    ? await ToolConfig.findOneAndUpdate(
        { toolSlug: slug },
        { $set: configUpdate },
        { new: true, upsert: true }
      ).lean()
    : await ToolConfig.findOne({ toolSlug: slug }).lean();

  // ── Update Tool document (including new dynamic fields) ───────────────────
  const toolUpdate: Record<string, unknown> = {};
  if (kit)            { toolUpdate.kits   = [kit]; }
  if (kitSlug)        { toolUpdate.kitSlug = kitSlug; toolUpdate.kits = [kitSlug]; }
  if (name)           toolUpdate.name            = name;
  if (description)    toolUpdate.description     = description;
  if (icon)           toolUpdate.icon            = icon;
  if (color)          toolUpdate.color           = color;
  if (type)           toolUpdate.type            = type;
  if (systemPrompt   !== undefined) toolUpdate.systemPrompt   = systemPrompt;
  if (promptTemplate !== undefined) toolUpdate.promptTemplate = promptTemplate;
  if (formFields)     toolUpdate.formFields      = formFields;
  if (outputType)     toolUpdate.outputType      = outputType;
  if (outputLabel)    toolUpdate.outputLabel     = outputLabel;
  if (tags)           toolUpdate.tags            = tags;
  if (maxOutputTokens !== undefined) toolUpdate.maxOutputTokens = maxOutputTokens;
  if (temperature    !== undefined) toolUpdate.temperature    = temperature;
  if (dailyLimit     !== undefined) toolUpdate.dailyLimit     = dailyLimit;
  if (requiredPlan)   toolUpdate.requiredPlan    = requiredPlan;

  let updatedKits: string[] | undefined;
  if (Object.keys(toolUpdate).length > 0) {
    const toolDoc = await Tool.findOneAndUpdate(
      { slug },
      { $set: toolUpdate },
      { new: true }
    ).lean();
    updatedKits = toolDoc?.kits as string[] | undefined;
  }

  // Invalidate Redis + in-process tool registry cache
  try {
    const { getRedis } = await import("@toolhub/shared");
    const redis = getRedis();
    await Promise.all([
      redis.del(`tool:config:${slug}`),
      redis.del("kits:public"),
      redis.del("registry:all_tools"),
      redis.del(`registry:tool:${slug}`),
    ]);
  } catch { /* silent */ }

  await clearToolCache();

  await AuditLog.create({
    adminId: admin.userId,
    action: "update_tool_config",
    target: `tool:${slug}`,
    before: before
      ? {
          creditCost: before.creditCost,
          aiModel: before.aiModel,
          isActive: before.isActive,
        }
      : null,
    after: {
      creditCost: config?.creditCost,
      aiModel: config?.aiModel,
      isActive: config?.isActive,
      ...(kit ? { kit } : {}),
    },
  });

  return NextResponse.json({ success: true, config, kits: updatedKits });
}
