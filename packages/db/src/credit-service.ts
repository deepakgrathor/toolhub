import _mongoose from "mongoose";
const mongoose =
  (_mongoose as unknown as { default: typeof _mongoose }).default ?? _mongoose;
import { User } from "./models/User";
import { CreditTransaction, ICreditTransaction } from "./models/CreditTransaction";

export class InsufficientCreditsError extends Error {
  constructor(public readonly balance: number, required: number) {
    super(`Insufficient credits: have ${balance}, need ${required}`);
    this.name = "InsufficientCreditsError";
  }
}

export class CreditService {
  static async checkBalance(userId: string, required: number): Promise<boolean> {
    const user = await User.findById(userId).select("credits").lean();
    return (user?.credits ?? 0) >= required;
  }

  static async getBalance(userId: string): Promise<number> {
    const user = await User.findById(userId).select("credits").lean();
    return user?.credits ?? 0;
  }

  static async deductCredits(
    userId: string,
    amount: number,
    toolSlug: string
  ): Promise<{ newBalance: number; transaction: ICreditTransaction }> {
    const session = await mongoose.startSession();

    let result: { newBalance: number; transaction: ICreditTransaction };

    await session.withTransaction(async () => {
      const user = await User.findById(userId).select("credits").session(session);
      if (!user) throw new Error("User not found");

      if (user.credits < amount) {
        throw new InsufficientCreditsError(user.credits, amount);
      }

      const newBalance = user.credits - amount;
      user.credits = newBalance;
      await user.save({ session });

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
    type: "purchase" | "referral_bonus" | "referral_reward" | "welcome_bonus" | "refund" | "manual_admin",
    meta?: object
  ): Promise<{ newBalance: number; transaction: ICreditTransaction }> {
    const session = await mongoose.startSession();

    let result: { newBalance: number; transaction: ICreditTransaction };

    await session.withTransaction(async () => {
      const user = await User.findById(userId).select("credits").session(session);
      if (!user) throw new Error("User not found");

      const newBalance = user.credits + amount;
      user.credits = newBalance;
      await user.save({ session });

      const [tx] = await CreditTransaction.create(
        [
          {
            userId: user._id,
            type,
            amount: +amount,
            balanceAfter: newBalance,
            meta,
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
