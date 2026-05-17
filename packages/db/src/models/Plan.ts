import { Schema, Document, Model, getOrCreateModel } from "../lib/mongoose-shim";

export interface IPlanFeature {
  text: string;
  included: boolean;
  highlight: string; // empty string = no tag, non-empty = tag label e.g. "Coming Soon"
}

export type PlanSlug = "free" | "lite" | "pro" | "business" | "enterprise";

export interface IPlanPricing {
  basePrice: number;
  pricePerCredit: number;
  baseCredits: number;
  maxCredits: number;
  cashfreePlanId?: string;
  discountPercent?: number;
}

export interface IPlanLimits {
  toolAccess: string;
  historyDays: number;
  teamSeats: number;
  businessProfiles: number;
  savedPresets: number;
  creditRolloverMonths: number; // -1 = unlimited
  watermark: boolean;
  pdfDownload: "none" | "branded" | "whitelabel";
  customUrl: boolean;
  usageReport: boolean;
  prioritySupport: boolean;
}

export interface IPlan extends Document {
  name: string;
  slug: PlanSlug;
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
  usageExamples: string[];
  creditRollover: {
    enabled: boolean;
    maxDays: number;
  };
  limits: IPlanLimits;
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
    highlight: { type: String, default: "" },
  },
  { _id: false }
);

const PlanLimitsSchema = new Schema<IPlanLimits>(
  {
    toolAccess:           { type: String,  default: "all" },
    historyDays:          { type: Number,  default: 0 },
    teamSeats:            { type: Number,  default: 1 },
    businessProfiles:     { type: Number,  default: 0 },
    savedPresets:         { type: Number,  default: 0 },   // -1 = unlimited
    creditRolloverMonths: { type: Number,  default: 0 },   // -1 = unlimited
    watermark:            { type: Boolean, default: true },
    pdfDownload:          { type: String,  default: "none" },
    customUrl:            { type: Boolean, default: false },
    usageReport:          { type: Boolean, default: false },
    prioritySupport:      { type: Boolean, default: false },
  },
  { _id: false },
);

const PlanSchema = new Schema<IPlan>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, enum: ["free", "lite", "pro", "business", "enterprise"] },
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
    usageExamples: { type: [String], default: [] },
    creditRollover: {
      enabled: { type: Boolean, default: false },
      maxDays: { type: Number, default: 30 },
    },
    limits: { type: PlanLimitsSchema, default: () => ({}) },
  },
  { timestamps: true }
);

export const Plan: Model<IPlan> = getOrCreateModel<IPlan>("Plan", PlanSchema);

export const DEFAULT_LIMITS: Record<string, IPlanLimits> = {
  free: {
    toolAccess: "all", historyDays: 0, teamSeats: 1,
    businessProfiles: 0, savedPresets: 0,
    creditRolloverMonths: 0, watermark: true,
    pdfDownload: "none", customUrl: false,
    usageReport: false, prioritySupport: false,
  },
  lite: {
    toolAccess: "all", historyDays: 30, teamSeats: 1,
    businessProfiles: 1, savedPresets: 0,
    creditRolloverMonths: 1, watermark: false,
    pdfDownload: "branded", customUrl: false,
    usageReport: false, prioritySupport: false,
  },
  pro: {
    toolAccess: "all", historyDays: 90, teamSeats: 1,
    businessProfiles: 3, savedPresets: 5,
    creditRolloverMonths: 2, watermark: false,
    pdfDownload: "branded", customUrl: false,
    usageReport: false, prioritySupport: false,
  },
  business: {
    toolAccess: "all", historyDays: 365, teamSeats: 5,
    businessProfiles: 10, savedPresets: -1,
    creditRolloverMonths: 3, watermark: false,
    pdfDownload: "whitelabel", customUrl: true,
    usageReport: true, prioritySupport: true,
  },
  enterprise: {
    toolAccess: "all", historyDays: -1, teamSeats: 999,
    businessProfiles: -1, savedPresets: -1,
    creditRolloverMonths: -1, watermark: false,
    pdfDownload: "whitelabel", customUrl: true,
    usageReport: true, prioritySupport: true,
  },
};
