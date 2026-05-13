import { Schema, Document, Model, getOrCreateModel } from "../lib/mongoose-shim";
import type { Types } from "mongoose";

export interface IBillingProfile extends Document {
  userId: Types.ObjectId;
  accountType: "individual" | "business";
  // Individual
  fullName?: string;
  phone?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  gstin?: string;
  // Business
  businessName?: string;
  gstState?: string;
  contactPerson?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BillingProfileSchema = new Schema<IBillingProfile>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    accountType: { type: String, enum: ["individual", "business"], default: "individual" },
    fullName: { type: String },
    phone: { type: String },
    addressLine1: { type: String },
    addressLine2: { type: String },
    city: { type: String },
    state: { type: String },
    pincode: { type: String },
    gstin: { type: String },
    businessName: { type: String },
    gstState: { type: String },
    contactPerson: { type: String },
  },
  { timestamps: true }
);

export const BillingProfile: Model<IBillingProfile> = getOrCreateModel<IBillingProfile>(
  "BillingProfile",
  BillingProfileSchema
);
