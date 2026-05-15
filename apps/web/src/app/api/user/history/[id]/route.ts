import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/require-auth";
import { connectDB, ToolOutput } from "@toolhub/db";
import mongoose from "mongoose";
import { TOOL_NAME_MAP } from "@/lib/tool-names";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await requireAuth();
  if (!authResult.authenticated) return authResult.response;
  const { userId } = authResult;

  await connectDB();

  const output = await ToolOutput.findOne({
    _id: new mongoose.Types.ObjectId(params.id),
    userId: new mongoose.Types.ObjectId(userId),
  }).lean();

  if (!output) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    _id: output._id,
    toolSlug: output.toolSlug,
    toolName: TOOL_NAME_MAP[output.toolSlug] ?? output.toolSlug,
    outputText: output.outputText ?? "",
    inputSnapshot: output.inputSnapshot,
    creditsUsed: output.creditsUsed,
    createdAt: output.createdAt,
  });
}
