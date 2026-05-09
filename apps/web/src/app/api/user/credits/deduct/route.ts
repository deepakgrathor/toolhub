import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB, CreditService, InsufficientCreditsError } from "@toolhub/db";
import { z } from "zod";
import { invalidateBalance, invalidateDashStats } from "@/lib/credit-cache";

const deductSchema = z.object({
  toolSlug: z.string().min(1),
  amount: z.number().int().positive(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = deductSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  await connectDB();

  try {
    const { newBalance } = await CreditService.deductCredits(
      session.user.id,
      parsed.data.amount,
      parsed.data.toolSlug
    );

    // Invalidate stale cached balance + dashboard stats
    await Promise.all([
      invalidateBalance(session.user.id),
      invalidateDashStats(session.user.id),
    ]);

    return NextResponse.json({ success: true, newBalance });
  } catch (err) {
    if (err instanceof InsufficientCreditsError) {
      return NextResponse.json(
        { error: "insufficient_credits", balance: err.balance },
        { status: 402 }
      );
    }
    console.error("[POST /api/user/credits/deduct]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
