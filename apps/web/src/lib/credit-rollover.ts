import { connectDB, User, CreditTransaction } from "@toolhub/db";
import { invalidateBalance } from "@/lib/credit-cache";
import { createNotification } from "@/lib/notifications";

const rolloverConfig: Record<string, { maxCarry: number }> = {
  lite:     { maxCarry: 200 },
  pro:      { maxCarry: 700 },
  business: { maxCarry: 1500 },
};

const planCreditsMap: Record<string, number> = {
  lite: 200,
  pro: 700,
  business: 1500,
};

export async function processUserRollover(
  userId: string,
  planSlug: string
): Promise<void> {
  const config = rolloverConfig[planSlug];
  if (!config) return; // free/enterprise — no rollover

  const planCredits = planCreditsMap[planSlug] ?? 0;

  await connectDB();
  const user = await User.findById(userId).select("credits").lean();
  if (!user) return;

  const currentBalance = user.credits ?? 0;
  const carryAmount = Math.min(currentBalance, config.maxCarry);

  if (carryAmount <= 0) return;

  const newBalance = planCredits + carryAmount;

  await User.findByIdAndUpdate(userId, { $set: { credits: newBalance } });

  await CreditTransaction.create({
    userId,
    type: "rollover",
    amount: carryAmount,
    note: `Credit rollover — ${carryAmount} credits carried forward`,
    balanceAfter: newBalance,
  });

  await createNotification({
    userId,
    type: "credit_added",
    title: "Credits Rolled Over",
    message: `${carryAmount} unused credits have been carried forward to this month.`,
  });

  await invalidateBalance(userId);
}
