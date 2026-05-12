import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { InsufficientCreditsError } from "@toolhub/db";
import { emailSubjectSchema } from "@/tools/email-subject/schema";
import { execute } from "@/tools/email-subject/engine";
import { runToolGuard } from "@/lib/tool-guard";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const guard = await runToolGuard(session.user.id, "email-subject");
  if (guard) return guard;


  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = emailSubjectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  try {
    const result = await execute(parsed.data, {
      userId: session.user.id,
      toolSlug: "email-subject",
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
    console.error("[POST /api/tools/email-subject]", message);
    return NextResponse.json(
      { error: "generation_failed", ...(process.env.NODE_ENV !== "production" && { detail: message }) },
      { status: 500 }
    );
  }
}
