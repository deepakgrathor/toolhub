import { NextRequest, NextResponse } from "next/server";
import { getRecommendedTools } from "@/lib/recommendations";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const professions = searchParams.getAll("professions");
  const teamSize = searchParams.get("teamSize") ?? undefined;
  const challenge = searchParams.get("challenge") ?? undefined;

  const tools = getRecommendedTools({
    professions: professions.length > 0 ? professions : [],
    teamSize,
    challenge,
  });

  return NextResponse.json({ tools });
}
