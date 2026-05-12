import { Schema, Document, Model, getOrCreateModel } from "../lib/mongoose-shim";
import type { Types } from "mongoose";

export interface IReferral extends Document {
  referrerId: Types.ObjectId;
  referredId: Types.ObjectId;
  refCode: string;
  status: "pending" | "completed" | "suspicious";
  referrerCredit: number;
  referredCredit: number;
  signupIP: string;
  completedAt?: Date | null;
  createdAt: Date;
}

const ReferralSchema = new Schema<IReferral>(
  {
    referrerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    referredId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    refCode: { type: String, required: true, index: true },
    status: {
      type: String,
      enum: ["pending", "completed", "suspicious"],
      default: "pending",
    },
    referrerCredit: { type: Number, default: 10 },
    referredCredit: { type: Number, default: 10 },
    signupIP: { type: String, required: true },
    completedAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const Referral: Model<IReferral> = getOrCreateModel<IReferral>("Referral", ReferralSchema);
