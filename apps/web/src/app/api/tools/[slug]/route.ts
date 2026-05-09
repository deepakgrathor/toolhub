import { NextResponse } from "next/server";
import { getToolBySlug } from "@/lib/tool-registry";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const tool = await getToolBySlug(params.slug);
    if (!tool) {
      return NextResponse.json({ error: "Tool not found" }, { status: 404 });
    }
    return NextResponse.json({ tool });
  } catch (err) {
    console.error(`[GET /api/tools/${params.slug}]`, err);
    return NextResponse.json({ error: "Failed to fetch tool" }, { status: 500 });
  }
}
