import { Schema, Document, Model, getOrCreateModel } from "../lib/mongoose-shim";
import type { Types } from "mongoose";

export type CreditTransactionType =
  | "purchase"
  | "use"
  | "refund"
  | "referral_bonus"
  | "referral_reward"
  | "welcome_bonus"
  | "manual_admin"
  | "plan_upgrade"
  | "credit_purchase"
  | "rollover"
  | "expiry";

export interface ICreditTransaction extends Document {
  userId: Types.ObjectId;
  type: CreditTransactionType;
  amount: number;
  balanceAfter: number;
  toolSlug?: string;
  note?: string;
  meta?: Record<string, unknown>;
  createdAt: Date;
}

const CreditTransactionSchema = new Schema<ICreditTransaction>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: {
      type: String,
      enum: [
        "purchase",
        "use",
        "refund",
        "referral_bonus",
        "referral_reward",
        "welcome_bonus",
        "manual_admin",
        "plan_upgrade",
        "credit_purchase",
        "rollover",
        "expiry",
      ],
      required: true,
    },
    amount: { type: Number, required: true },
    balanceAfter: { type: Number, required: true },
    toolSlug: { type: String, index: true },
    note: { type: String },
    meta: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const CreditTransaction: Model<ICreditTransaction> =
  getOrCreateModel<ICreditTransaction>("CreditTransaction", CreditTransactionSchema);
