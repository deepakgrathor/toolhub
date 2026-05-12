import { Schema, Document, Model, getOrCreateModel } from "../lib/mongoose-shim";

export interface ICreditPack extends Document {
  name: string;
  credits: number;
  price: number;
  pricePerCredit: number;
  isActive: boolean;
  isPopular: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const CreditPackSchema = new Schema<ICreditPack>(
  {
    name: { type: String, required: true, trim: true },
    credits: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
    pricePerCredit: { type: Number, required: true, min: 0, default: 0 },
    isActive: { type: Boolean, default: true },
    isPopular: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const CreditPack: Model<ICreditPack> = getOrCreateModel<ICreditPack>(
  "CreditPack",
  CreditPackSchema
);
