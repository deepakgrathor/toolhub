import _mongoose from "mongoose";
const mongoose =
  (_mongoose as unknown as { default: typeof _mongoose }).default ?? _mongoose;
import { User } from "./models/User";
import { CreditTransaction, ICreditTransaction, CreditTransactionType } from "./models/CreditTransaction";

export class InsufficientCreditsError extends Error {
  constructor(public readonly balance: number, required: number) {
    super(`Insufficient credits: have ${balance}, need ${required}`);
    this.name = "InsufficientCreditsError";
  }
}

export class CreditService {
  static async getBalance(userId: string): Promise<number> {
    const user = await User.findById(userId)
      .select("purchasedCredits subscriptionCredits rolloverCredits")
      .lean();
    return (
      (user?.purchasedCredits ?? 0) +
      (user?.subscriptionCredits ?? 0) +
      (user?.rolloverCredits ?? 0)
    );
  }

  static async checkBalance(userId: string, required: number): Promise<boolean> {
    const balance = await CreditService.getBalance(userId);
    return balance >= required;
  }

  static async deductCredits(
    userId: string,
    amount: number,
    toolSlug: string
  ): Promise<{ newBalance: number; transaction: ICreditTransaction }> {
    const session = await mongoose.startSession();

    let result: { newBalance: number; transaction: ICreditTransaction };

    await session.withTransaction(async () => {
      const user = await User.findById(userId)
        .select("purchasedCredits subscriptionCredits rolloverCredits")
        .session(session);
      if (!user) throw new Error("User not found");

      const total =
        (user.purchasedCredits ?? 0) +
        (user.subscriptionCredits ?? 0) +
        (user.rolloverCredits ?? 0);

      if (total < amount) {
        throw new InsufficientCreditsError(total, amount);
      }

      // Deduction order: purchased → subscription → rollover
      let remaining = amount;

      // 1. Deduct from purchasedCredits first (never expire)
      const fromPurchased = Math.min(remaining, user.purchasedCredits ?? 0);
      user.purchasedCredits -= fromPurchased;
      remaining -= fromPurchased;

      // 2. Deduct from subscriptionCredits
      if (remaining > 0) {
        const fromSub = Math.min(remaining, user.subscriptionCredits ?? 0);
        user.subscriptionCredits -= fromSub;
        remaining -= fromSub;
      }

      // 3. Deduct from rolloverCredits last
      if (remaining > 0) {
        const fromRollover = Math.min(remaining, user.rolloverCredits ?? 0);
        user.rolloverCredits -= fromRollover;
        remaining -= fromRollover;
      }

      await user.save({ session });

      const newBalance =
        (user.purchasedCredits ?? 0) +
        (user.subscriptionCredits ?? 0) +
        (user.rolloverCredits ?? 0);

      const [tx] = await CreditTransaction.create(
        [
          {
            userId: user._id,
            type: "use",
            amount: -amount,
            balanceAfter: newBalance,
            toolSlug,
          },
        ],
        { session }
      );

      result = { newBalance, transaction: tx };
    });

    await session.endSession();
    return result!;
  }

  static async addCredits(
    userId: string,
    amount: number,
    type: CreditTransactionType,
    meta?: object
  ): Promise<{ newBalance: number; transaction: ICreditTransaction }> {
    const session = await mongoose.startSession();

    let result: { newBalance: number; transaction: ICreditTransaction };

    await session.withTransaction(async () => {
      const user = await User.findById(userId)
        .select("purchasedCredits subscriptionCredits rolloverCredits")
        .session(session);
      if (!user) throw new Error("User not found");

      // Route to the correct bucket based on transaction type
      switch (type) {
        case "credit_purchase":
        case "purchase":
        case "refund":
          // Purchased credits — never expire
          user.purchasedCredits = (user.purchasedCredits ?? 0) + amount;
          break;

        case "rollover":
          // Rollover credits must be set directly via processUserRollover(),
          // not through addCredits, to ensure expiry tracking is also updated.
          throw new Error(
            "Use processUserRollover() for rollover credits, not addCredits()"
          );

        case "plan_upgrade":
        case "welcome_bonus":
        case "referral_bonus":
        case "referral_reward":
        case "manual_admin":
        default:
          // Subscription-type credits
          user.subscriptionCredits = (user.subscriptionCredits ?? 0) + amount;
          break;
      }

      await user.save({ session });

      const newBalance =
        (user.purchasedCredits ?? 0) +
        (user.subscriptionCredits ?? 0) +
        (user.rolloverCredits ?? 0);

      const [tx] = await CreditTransaction.create(
        [
          {
            userId: user._id,
            type,
            amount: +amount,
            balanceAfter: newBalance,
            ...(meta ? { meta } : {}),
          },
        ],
        { session }
      );

      result = { newBalance, transaction: tx };
    });

    await session.endSession();
    return result!;
  }

  static async getTransactionHistory(
    userId: string,
    limit = 20
  ): Promise<ICreditTransaction[]> {
    return CreditTransaction.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean() as unknown as Promise<ICreditTransaction[]>;
  }
}
