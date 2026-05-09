import { NextResponse } from "next/server";
import { getAllTools } from "@/lib/tool-registry";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const tools = await getAllTools();
    return NextResponse.json({ tools });
  } catch (err) {
    console.error("[GET /api/tools]", err);
    return NextResponse.json({ error: "Failed to fetch tools" }, { status: 500 });
  }
}
