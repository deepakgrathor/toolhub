import { Schema, Document, Model, getOrCreateModel } from "../lib/mongoose-shim";

export interface ICreditPack extends Document {
  name: string;
  credits: number;
  priceInr: number;
  isActive: boolean;
  isFeatured: boolean;
  razorpayPlanId?: string;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const CreditPackSchema = new Schema<ICreditPack>(
  {
    name: { type: String, required: true, trim: true },
    credits: { type: Number, required: true, min: 1 },
    priceInr: { type: Number, required: true, min: 0 },
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    razorpayPlanId: { type: String },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const CreditPack: Model<ICreditPack> = getOrCreateModel<ICreditPack>(
  "CreditPack",
  CreditPackSchema
);
