import { NextRequest, NextResponse } from "next/server";
import { connectDB, Kit, Tool } from "@toolhub/db";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    await connectDB();

    const [kit, tools] = await Promise.all([
      Kit.findOne({ slug: params.slug, isActive: true }).lean(),
      Tool.find({ kitSlug: params.slug }).lean(),
    ]);

    if (!kit) {
      return NextResponse.json({ error: "Kit not found" }, { status: 404 });
    }

    return NextResponse.json({ kit, tools });
  } catch (err) {
    console.error("[GET /api/public/kits/[slug]]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
