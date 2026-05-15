import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB, CreditService, InsufficientCreditsError, User, ToolConfig } from "@toolhub/db";
import { z } from "zod";
import { invalidateBalance, invalidateDashStats } from "@/lib/credit-cache";
import { checkAndSendCreditAlert } from "@/lib/credit-alerts";

const deductSchema = z.object({
  toolSlug: z.string().min(1),
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
    const toolConfig = await ToolConfig.findOne({ toolSlug: parsed.data.toolSlug }).lean();
    if (!toolConfig) {
      return NextResponse.json({ error: "Tool not found" }, { status: 404 });
    }
    const amount = toolConfig.creditCost;

    if (amount === 0) {
      return NextResponse.json({ success: true });
    }

    const { newBalance } = await CreditService.deductCredits(
      session.user.id,
      amount,
      parsed.data.toolSlug
    );

    // Invalidate stale cached balance + dashboard stats
    await Promise.all([
      invalidateBalance(session.user.id),
      invalidateDashStats(session.user.id),
    ]);

    // Fire-and-forget credit low alert (never blocks response)
    const userPlan = await User.findById(session.user.id).select("plan").lean();
    void checkAndSendCreditAlert(session.user.id, newBalance, userPlan?.plan ?? "free");

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
