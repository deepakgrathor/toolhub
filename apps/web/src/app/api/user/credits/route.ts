import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/require-auth";
import { ApiResponse } from "@/lib/api-response";
// TODO: migrate remaining NextResponse.json calls to ApiResponse helpers
import { connectDB, CreditService, User } from "@toolhub/db";
import { getCachedBalance, setCachedBalance } from "@/lib/credit-cache";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const authResult = await requireAuth();
    if (!authResult.authenticated) return authResult.response;
    const { userId } = authResult;

    // Try Redis cache first (avoids DB round-trip on every navbar/store sync)
    const cached = await getCachedBalance(userId);
    if (cached !== null) {
      return NextResponse.json({ balance: cached });
    }

    await connectDB();

    const [userDoc, transactions] = await Promise.all([
      User.findById(userId)
        .select("purchasedCredits subscriptionCredits rolloverCredits rolloverExpiresAt")
        .lean(),
      CreditService.getTransactionHistory(userId, 20),
    ]);

    const purchased    = userDoc?.purchasedCredits ?? 0;
    const subscription = userDoc?.subscriptionCredits ?? 0;
    const rollover     = userDoc?.rolloverCredits ?? 0;
    const balance      = purchased + subscription + rollover;

    // Cache total balance for 5 min
    await setCachedBalance(userId, balance);

    return NextResponse.json({
      balance,
      breakdown: {
        purchased,
        subscription,
        rollover,
        rolloverExpiresAt: userDoc?.rolloverExpiresAt ?? null,
      },
      transactions,
    });
  } catch (err) {
    console.error("[/api/user/credits] Error:", err);
    return ApiResponse.error("Server error");
  }
}
