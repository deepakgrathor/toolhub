import { NextRequest, NextResponse } from "next/server";
import { getRecommendedToolsFromDB } from "@/lib/recommendations";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const professions = searchParams.getAll("professions");
  const teamSize    = searchParams.get("teamSize")  ?? undefined;
  const challenge   = searchParams.get("challenge") ?? undefined;

  try {
    const tools = await getRecommendedToolsFromDB({
      professions: professions.length > 0 ? professions : [],
      teamSize,
      challenge,
    });
    return NextResponse.json({ tools });
  } catch {
    return NextResponse.json({ tools: [] });
  }
}
