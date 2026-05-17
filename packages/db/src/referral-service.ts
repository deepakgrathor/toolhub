import _mongoose from "mongoose";
const mongoose =
  (_mongoose as unknown as { default: typeof _mongoose }).default ?? _mongoose;

import { User } from "./models/User";
import { CreditTransaction } from "./models/CreditTransaction";

export async function applyReferral(
  newUserId: string,
  referralCode: string
): Promise<void> {
  try {
    const referrer = await User.findOne({ referralCode }).select("_id referralCount");
    if (!referrer) return;

    const session = await mongoose.startSession();

    await session.withTransaction(async () => {
      const newUser = await User.findById(newUserId)
        .select("purchasedCredits subscriptionCredits rolloverCredits referredBy")
        .session(session);
      if (!newUser) throw new Error("New user not found");

      const ref = await User.findById(referrer._id)
        .select("purchasedCredits subscriptionCredits rolloverCredits referralCount")
        .session(session);
      if (!ref) throw new Error("Referrer not found");

      // Referral bonuses go to subscriptionCredits bucket
      newUser.subscriptionCredits = (newUser.subscriptionCredits ?? 0) + 15;
      newUser.referredBy = referrer._id as typeof newUser.referredBy;
      await newUser.save({ session });

      ref.subscriptionCredits = (ref.subscriptionCredits ?? 0) + 10;
      ref.referralCount += 1;
      await ref.save({ session });

      const newUserBalance =
        (newUser.purchasedCredits ?? 0) +
        (newUser.subscriptionCredits ?? 0) +
        (newUser.rolloverCredits ?? 0);

      const refBalance =
        (ref.purchasedCredits ?? 0) +
        (ref.subscriptionCredits ?? 0) +
        (ref.rolloverCredits ?? 0);

      await CreditTransaction.create(
        [
          {
            userId: newUser._id,
            type: "referral_bonus",
            amount: 15,
            balanceAfter: newUserBalance,
            meta: { referredBy: referrer._id.toString() },
          },
          {
            userId: ref._id,
            type: "referral_bonus",
            amount: 10,
            balanceAfter: refBalance,
            meta: { referredUser: newUser._id.toString() },
          },
        ],
        { session }
      );
    });

    await session.endSession();
  } catch (err) {
    // Silent fail — never break signup on referral error
    console.error("[applyReferral]", err);
  }
}
