import { Schema, Document, Model, getOrCreateModel } from "../lib/mongoose-shim";
import type { Types } from "mongoose";

export interface INotification extends Document {
  userId: Types.ObjectId;
  type: "referral_joined" | "credit_added" | "purchase_success" | "admin_push";
  title: string;
  message: string;
  isRead: boolean;
  meta?: Record<string, unknown>;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: {
      type: String,
      enum: ["referral_joined", "credit_added", "purchase_success", "admin_push"],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    meta: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const Notification: Model<INotification> = getOrCreateModel<INotification>(
  "Notification",
  NotificationSchema
);
