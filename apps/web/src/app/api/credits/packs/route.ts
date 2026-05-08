import { NextResponse } from "next/server";
import { connectDB, CreditPack } from "@toolhub/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectDB();
    const packs = await CreditPack.find({ isActive: true })
      .sort({ sortOrder: 1 })
      .lean();
    return NextResponse.json({ packs });
  } catch (err) {
    console.error("[GET /api/credits/packs]", err);
    return NextResponse.json({ error: "Failed to fetch packs" }, { status: 500 });
  }
}
