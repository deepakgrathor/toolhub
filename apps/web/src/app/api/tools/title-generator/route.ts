import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { InsufficientCreditsError } from "@toolhub/db";
import { titleGeneratorSchema } from "@/tools/title-generator/schema";
import { execute } from "@/tools/title-generator/engine";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = titleGeneratorSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  try {
    const result = await execute(parsed.data, {
      userId: session.user.id,
      toolSlug: "title-generator",
    });
    return NextResponse.json({
      success: true,
      output: result.structured,
      creditsUsed: result.creditsUsed,
      newBalance: result.newBalance,
    });
  } catch (error) {
    if (error instanceof InsufficientCreditsError) {
      return NextResponse.json({ error: "insufficient_credits" }, { status: 402 });
    }
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[POST /api/tools/title-generator]", message);
    return NextResponse.json(
      { error: "generation_failed", ...(process.env.NODE_ENV !== "production" && { detail: message }) },
      { status: 500 }
    );
  }
}
