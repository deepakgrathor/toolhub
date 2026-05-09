import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB, Tool, ToolConfig, AuditLog } from "@toolhub/db";
import { z } from "zod";
import { clearToolCache } from "@/lib/tool-registry";

export const dynamic = "force-dynamic";

const KIT_VALUES = ["creator", "sme", "hr", "ca-legal", "marketing"] as const;

const schema = z.object({
  creditCost: z.number().int().min(0).optional(),
  aiModel: z.string().optional(),
  aiProvider: z.string().optional(),
  isActive: z.boolean().optional(),
  isVisible: z.boolean().optional(),
  kit: z.enum(KIT_VALUES).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { slug } = params;
  const { kit, ...configFields } = parsed.data;

  await connectDB();

  const before = await ToolConfig.findOne({ toolSlug: slug }).lean();

  const config = await ToolConfig.findOneAndUpdate(
    { toolSlug: slug },
    { $set: configFields },
    { new: true, upsert: true }
  ).lean();

  // Update Tool.kits if kit assignment changed
  let updatedKits: string[] | undefined;
  if (kit) {
    const toolDoc = await Tool.findOneAndUpdate(
      { slug },
      { $set: { kits: [kit] } },
      { new: true }
    ).lean();
    updatedKits = toolDoc?.kits as string[] | undefined;
  }

  // Invalidate in-process tool registry cache so next request sees fresh data
  await clearToolCache();

  await AuditLog.create({
    adminId: session.user.id,
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
