import { NextResponse } from "next/server";
import { getAllTools } from "@/lib/tool-registry";

export const dynamic = "force-dynamic";
// Short cache — 30s edge cache so sidebar refreshes quickly after admin changes
export const revalidate = 30;

/** Returns slugs of all active+visible tools. Sidebar uses this to filter hardcoded SIDEBAR_KITS. */
export async function GET() {
  try {
    const tools = await getAllTools();
    const slugs = tools.map((t) => t.slug);
    return NextResponse.json({ slugs }, {
      headers: { "Cache-Control": "public, max-age=30, stale-while-revalidate=60" },
    });
  } catch {
    // On error return empty array so sidebar still renders (shows nothing)
    return NextResponse.json({ slugs: [] });
  }
}
