import { Schema, Document, Model, getOrCreateModel } from "../lib/mongoose-shim";
import type { Types } from "mongoose";

export interface ICreditTransaction extends Document {
  userId: Types.ObjectId;
  type: "purchase" | "use" | "refund" | "referral_bonus" | "manual_admin";
  amount: number;
  balanceAfter: number;
  toolSlug?: string;
  meta?: Record<string, unknown>;
  createdAt: Date;
}

const CreditTransactionSchema = new Schema<ICreditTransaction>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: {
      type: String,
      enum: ["purchase", "use", "refund", "referral_bonus", "manual_admin"],
      required: true,
    },
    amount: { type: Number, required: true },
    balanceAfter: { type: Number, required: true },
    toolSlug: { type: String },
    meta: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const CreditTransaction: Model<ICreditTransaction> =
  getOrCreateModel<ICreditTransaction>("CreditTransaction", CreditTransactionSchema);
