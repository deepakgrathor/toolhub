import { NextRequest, NextResponse } from "next/server";
import { connectDB, CreditTransaction, User, ToolConfig } from "@toolhub/db";
import { requireAdmin } from "@/lib/admin-auth";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  await connectDB();

  const txn = await CreditTransaction.findById(id).lean();
  if (!txn) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const user = await User.findById(txn.userId)
    .select("email name plan credits createdAt referredBy")
    .lean();

  let tool = null;
  if (txn.type === "use" && txn.toolSlug) {
    const tc = await ToolConfig.findOne({ toolSlug: txn.toolSlug })
      .select("toolSlug creditCost aiModel aiProvider")
      .lean();
    if (tc) {
      tool = {
        toolSlug: tc.toolSlug,
        creditCost: tc.creditCost,
        aiModel: tc.aiModel,
        aiProvider: tc.aiProvider,
      };
    }
  }

  return NextResponse.json({
    transaction: {
      _id: (txn._id as mongoose.Types.ObjectId).toString(),
      type: txn.type,
      amount: txn.amount,
      balanceAfter: txn.balanceAfter,
      toolSlug: txn.toolSlug ?? null,
      note: txn.note ?? null,
      meta: txn.meta ?? null,
      createdAt: txn.createdAt,
      user: user
        ? {
            _id: (user._id as mongoose.Types.ObjectId).toString(),
            email: user.email,
            name: user.name,
            plan: user.plan,
            credits: user.credits,
            createdAt: user.createdAt,
          }
        : null,
      tool,
    },
  });
}
