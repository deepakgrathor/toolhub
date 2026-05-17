import mongoose from "mongoose";
import { connectDB, User, Plan, CreditTransaction } from "@toolhub/db";
import { invalidateBalance } from "@/lib/credit-cache";
import { createNotification } from "@/lib/notifications";
import { getCreditRolloverMonths } from "@/lib/plan-limits";

export async function processUserRollover(
  userId: string,
  planSlug: string
): Promise<void> {
  await connectDB();

  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {

      // 1. Fetch user with all credit + rollover fields
      const user = await User.findById(userId)
        .select(
          "purchasedCredits subscriptionCredits rolloverCredits " +
          "rolloverExpiresAt lastRolloverAt plan"
        )
        .session(session);

      if (!user) throw new Error(`User ${userId} not found`);

      // 2. Idempotency guard — skip if already rolled over this calendar month
      const now = new Date();
      if (user.lastRolloverAt) {
        const last = new Date(user.lastRolloverAt);
        const sameMonth =
          last.getFullYear() === now.getFullYear() &&
          last.getMonth() === now.getMonth();
        if (sameMonth) {
          console.log(`[rollover] Skipping ${userId} — already rolled over this month`);
          return;
        }
      }

      // 3. Get creditRolloverMonths from plan limits (DB-driven, cached)
      const rolloverMonths = await getCreditRolloverMonths(userId);
      if (rolloverMonths === 0) {
        console.log(`[rollover] Skipping ${userId} — plan has no rollover`);
        return;
      }

      // 4. Get fresh monthly credits from Plan doc (DB-driven)
      const plan = await Plan.findOne({ slug: planSlug })
        .select("pricing.monthly.baseCredits")
        .lean();
      const monthlyCredits = plan?.pricing?.monthly?.baseCredits ?? 0;
      if (monthlyCredits === 0) {
        console.log(`[rollover] Skipping ${userId} — plan has 0 base credits`);
        return;
      }

      // 5. Expire old rolloverCredits if rolloverExpiresAt has passed
      const oldRollover = user.rolloverCredits ?? 0;
      if (
        oldRollover > 0 &&
        user.rolloverExpiresAt &&
        new Date(user.rolloverExpiresAt) <= now
      ) {
        user.rolloverCredits = 0;
        user.rolloverExpiresAt = null;

        await CreditTransaction.create(
          [{
            userId,
            type: "expiry",
            amount: -oldRollover,
            balanceAfter:
              (user.purchasedCredits ?? 0) +
              (user.subscriptionCredits ?? 0) +
              0, // rolloverCredits just zeroed
            note: "Rollover credits expired",
          }],
          { session }
        );
      }

      // 6. Carry forward all unused subscriptionCredits → rolloverCredits
      const carryAmount = user.subscriptionCredits ?? 0;

      // 7. Reset subscriptionCredits to fresh monthly grant
      user.subscriptionCredits = monthlyCredits;

      // 8. Accumulate carryAmount into rolloverCredits
      // (can stack if rolloverMonths > 1 and prior rollover hasn't expired)
      user.rolloverCredits = (user.rolloverCredits ?? 0) + carryAmount;

      // 9. Set rolloverExpiresAt — null means never expires (enterprise: -1)
      if (rolloverMonths === -1) {
        user.rolloverExpiresAt = null;
      } else {
        const expiresAt = new Date(now);
        expiresAt.setMonth(expiresAt.getMonth() + rolloverMonths);
        user.rolloverExpiresAt = expiresAt;
      }

      // 10. Idempotency timestamp
      user.lastRolloverAt = now;

      await user.save({ session });

      // 11. Calculate new total balance for transactions
      const newBalance =
        (user.purchasedCredits ?? 0) +
        (user.subscriptionCredits ?? 0) +
        (user.rolloverCredits ?? 0);

      // 12. Rollover carry transaction (only if something was carried)
      if (carryAmount > 0) {
        const expiryLabel =
          user.rolloverExpiresAt
            ? `Expires ${user.rolloverExpiresAt.toDateString()}`
            : "Never expires";
        await CreditTransaction.create(
          [{
            userId,
            type: "rollover",
            amount: carryAmount,
            balanceAfter: newBalance,
            note: `${carryAmount} credits carried forward. ${expiryLabel}`,
          }],
          { session }
        );
      }

      // 13. Monthly subscription refresh transaction
      await CreditTransaction.create(
        [{
          userId,
          type: "plan_upgrade",
          amount: monthlyCredits,
          balanceAfter: newBalance,
          note: `Monthly ${planSlug} credits refreshed`,
        }],
        { session }
      );

    }); // end withTransaction

    // 14. Invalidate balance cache (outside transaction — non-critical)
    await invalidateBalance(userId);

    // 15. Notify user
    await createNotification({
      userId,
      type: "credit_added",
      title: "Credits Refreshed",
      message: "Your monthly credits have been refreshed and any unused credits carried forward.",
    });

  } finally {
    await session.endSession();
  }
}
