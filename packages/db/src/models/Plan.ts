import { Schema, Document, Model, getOrCreateModel } from "../lib/mongoose-shim";

export interface IPlanFeature {
  text: string;
  included: boolean;
  highlight: boolean;
}

export interface IPlanPricing {
  basePrice: number;
  pricePerCredit: number;
  baseCredits: number;
  maxCredits: number;
  cashfreePlanId?: string;
  discountPercent?: number;
}

export interface IPlan extends Document {
  name: string;
  slug: string;
  tagline: string;
  isActive: boolean;
  isPopular: boolean;
  order: number;
  type: "free" | "credit" | "enterprise";
  pricing: {
    monthly: IPlanPricing;
    yearly: IPlanPricing;
  };
  features: IPlanFeature[];
  creditRollover: {
    enabled: boolean;
    maxDays: number;
  };
  limits: {
    toolAccess: "free_only" | "all";
    historyDays: number;
    teamSeats: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const PlanPricingSchema = new Schema<IPlanPricing>(
  {
    basePrice: { type: Number, required: true, default: 0 },
    pricePerCredit: { type: Number, required: true, default: 0 },
    baseCredits: { type: Number, required: true, default: 0 },
    maxCredits: { type: Number, required: true, default: 0 },
    cashfreePlanId: { type: String },
    discountPercent: { type: Number, default: 30 },
  },
  { _id: false }
);

const PlanFeatureSchema = new Schema<IPlanFeature>(
  {
    text: { type: String, required: true },
    included: { type: Boolean, default: true },
    highlight: { type: Boolean, default: false },
  },
  { _id: false }
);

const PlanSchema = new Schema<IPlan>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    tagline: { type: String, required: true, default: "" },
    isActive: { type: Boolean, default: true },
    isPopular: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
    type: { type: String, enum: ["free", "credit", "enterprise"], required: true },
    pricing: {
      monthly: { type: PlanPricingSchema, required: true },
      yearly: { type: PlanPricingSchema, required: true },
    },
    features: { type: [PlanFeatureSchema], default: [] },
    creditRollover: {
      enabled: { type: Boolean, default: false },
      maxDays: { type: Number, default: 30 },
    },
    limits: {
      toolAccess: {
        type: String,
        enum: ["free_only", "all"],
        default: "all",
      },
      historyDays: { type: Number, default: -1 },
      teamSeats: { type: Number, default: 1 },
    },
  },
  { timestamps: true }
);

export const Plan: Model<IPlan> = getOrCreateModel<IPlan>("Plan", PlanSchema);
