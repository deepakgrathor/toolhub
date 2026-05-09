import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB, ToolConfig, AuditLog } from "@toolhub/db";
import { z } from "zod";
import { clearToolCache } from "@/lib/tool-registry";

export const dynamic = "force-dynamic";

const schema = z.object({
  creditCost: z.number().int().min(0).optional(),
  aiModel: z.string().optional(),
  aiProvider: z.string().optional(),
  isActive: z.boolean().optional(),
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
  await connectDB();

  const before = await ToolConfig.findOne({ toolSlug: slug }).lean();

  const config = await ToolConfig.findOneAndUpdate(
    { toolSlug: slug },
    { $set: parsed.data },
    { new: true, upsert: true }
  ).lean();

  // Invalidate in-process tool registry cache so next request sees fresh data
  clearToolCache();

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
    },
  });

  return NextResponse.json({ success: true, config });
}
