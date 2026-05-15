import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/require-auth";
import { connectDB, CreditService } from "@toolhub/db";
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

    const [balance, transactions] = await Promise.all([
      CreditService.getBalance(userId),
      CreditService.getTransactionHistory(userId, 20),
    ]);

    // Cache for 5 min
    await setCachedBalance(userId, balance);

    return NextResponse.json({ balance, transactions });
  } catch (err) {
    console.error("[/api/user/credits] Error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
