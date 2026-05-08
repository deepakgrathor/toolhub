import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB, CreditService } from "@toolhub/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();

  const [balance, transactions] = await Promise.all([
    CreditService.getBalance(session.user.id),
    CreditService.getTransactionHistory(session.user.id, 20),
  ]);

  return NextResponse.json({ balance, transactions });
}
