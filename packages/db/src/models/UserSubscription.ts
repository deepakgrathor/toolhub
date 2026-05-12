import { Schema, Document, Model, getOrCreateModel } from "../lib/mongoose-shim";
import type { Types } from "mongoose";

export interface IUserSubscription extends Document {
  userId: Types.ObjectId;
  planSlug: string;
  billingCycle: "monthly" | "yearly";
  creditsSelected: number;
  status: "active" | "cancelled" | "expired" | "trial";
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cashfreeOrderId?: string;
  cashfreeSubId?: string;
  autoRenew: boolean;
  cancelledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSubscriptionSchema = new Schema<IUserSubscription>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    planSlug: { type: String, required: true },
    billingCycle: {
      type: String,
      enum: ["monthly", "yearly"],
      required: true,
    },
    creditsSelected: { type: Number, required: true, default: 0 },
    status: {
      type: String,
      enum: ["active", "cancelled", "expired", "trial"],
      required: true,
      default: "active",
    },
    currentPeriodStart: { type: Date, required: true },
    currentPeriodEnd: { type: Date, required: true },
    cashfreeOrderId: { type: String },
    cashfreeSubId: { type: String },
    autoRenew: { type: Boolean, default: true },
    cancelledAt: { type: Date },
  },
  { timestamps: true }
);

UserSubscriptionSchema.index({ userId: 1, status: 1 });

export const UserSubscription: Model<IUserSubscription> =
  getOrCreateModel<IUserSubscription>("UserSubscription", UserSubscriptionSchema);
