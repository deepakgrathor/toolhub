import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB, ToolOutput } from "@toolhub/db";
import mongoose from "mongoose";

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

  return NextResponse.json({
    outputs,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}
