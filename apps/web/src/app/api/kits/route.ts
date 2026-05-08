import { NextResponse } from "next/server";
import { getKitList } from "@/lib/tool-registry";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const kits = await getKitList();
    return NextResponse.json({ kits });
  } catch (err) {
    console.error("[GET /api/kits]", err);
    return NextResponse.json({ error: "Failed to fetch kits" }, { status: 500 });
  }
}
