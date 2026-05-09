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
    const referrer = await User.findOne({ referralCode }).select("_id credits referralCount");
    if (!referrer) return;

    const session = await mongoose.startSession();

    await session.withTransaction(async () => {
      const newUser = await User.findById(newUserId).select("credits referredBy").session(session);
      if (!newUser) throw new Error("New user not found");

      const ref = await User.findById(referrer._id).select("credits referralCount").session(session);
      if (!ref) throw new Error("Referrer not found");

      // Credit new user +15
      newUser.credits += 15;
      newUser.referredBy = referrer._id as typeof newUser.referredBy;
      await newUser.save({ session });

      // Credit referrer +10, bump count
      ref.credits += 10;
      ref.referralCount += 1;
      await ref.save({ session });

      // Transaction records for both
      await CreditTransaction.create(
        [
          {
            userId: newUser._id,
            type: "referral_bonus",
            amount: 15,
            balanceAfter: newUser.credits,
            meta: { referredBy: referrer._id.toString() },
          },
          {
            userId: ref._id,
            type: "referral_bonus",
            amount: 10,
            balanceAfter: ref.credits,
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
