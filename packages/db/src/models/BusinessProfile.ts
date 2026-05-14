import { Schema, Document, Model, getOrCreateModel } from "../lib/mongoose-shim";
import type { Types } from "mongoose";

export interface IBusinessProfile extends Document {
  userId: Types.ObjectId;
  businessName?: string | null;
  businessType?: string | null;
  industry?: string | null;
  gstNumber?: string | null;
  gstState?: string | null;
  website?: string | null;
  teamSize?: "solo" | "2-10" | "11-50" | "50+" | null;
  businessAddress?: string | null;
  logo?: string | null;
  phone?: string | null;
  logoUrl?: string | null;
  signatureUrl?: string | null;
  letterheadColor?: string;
  signatoryName?: string;
  signatoryDesignation?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BusinessProfileSchema = new Schema<IBusinessProfile>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", unique: true, required: true },
    businessName: { type: String, default: null },
    businessType: { type: String, default: null },
    industry: { type: String, default: null },
    gstNumber: { type: String, default: null },
    gstState: { type: String, default: null },
    website: { type: String, default: null },
    teamSize: {
      type: String,
      enum: ["solo", "2-10", "11-50", "50+", null],
      default: null,
    },
    businessAddress: { type: String, default: null },
    logo: { type: String, default: null },
    phone: { type: String, default: null },
    logoUrl: { type: String, default: null },
    signatureUrl: { type: String, default: null },
    letterheadColor: { type: String, default: '#7c3aed' },
    signatoryName: { type: String, default: '' },
    signatoryDesignation: { type: String, default: '' },
  },
  { timestamps: true }
);

export const BusinessProfile: Model<IBusinessProfile> =
  getOrCreateModel<IBusinessProfile>("BusinessProfile", BusinessProfileSchema);
