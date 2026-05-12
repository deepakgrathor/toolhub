/**
 * Seed plans + credit packs (B6 production pricing).
 * Run: MONGODB_URI="..." npx tsx apps/web/src/scripts/seed-plans.ts
 * Safe to re-run — uses upsert by slug / name.
 */

import mongoose from "mongoose";

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI not set");
  process.exit(1);
}

// ── Minimal inline schemas ────────────────────────────────────────────────────

const PlanPricingSchema = new mongoose.Schema(
  {
    basePrice: { type: Number, default: 0 },
    pricePerCredit: { type: Number, default: 0 },
    baseCredits: { type: Number, default: 0 },
    maxCredits: { type: Number, default: 0 },
    cashfreePlanId: { type: String },
    discountPercent: { type: Number, default: 0 },
  },
  { _id: false }
);

const PlanFeatureSchema = new mongoose.Schema(
  {
    text: String,
    included: { type: Boolean, default: true },
    highlight: { type: String, default: "" },
  },
  { _id: false }
);

const PlanSchema = new mongoose.Schema(
  {
    name: String,
    slug: { type: String, unique: true },
    tagline: String,
    isActive: { type: Boolean, default: true },
    isPopular: { type: Boolean, default: false },
    order: Number,
    type: { type: String, enum: ["free", "credit", "enterprise"] },
    pricing: { monthly: PlanPricingSchema, yearly: PlanPricingSchema },
    features: [PlanFeatureSchema],
    usageExamples: [String],
    creditRollover: { enabled: Boolean, maxDays: Number },
    limits: { toolAccess: String, historyDays: Number, teamSeats: Number },
  },
  { timestamps: true }
);

const CreditPackSchema = new mongoose.Schema(
  {
    name: String,
    credits: Number,
    price: Number,
    pricePerCredit: Number,
    isActive: { type: Boolean, default: true },
    isPopular: { type: Boolean, default: false },
    order: Number,
  },
  { timestamps: true }
);

const Plan = mongoose.models.Plan ?? mongoose.model("Plan", PlanSchema);
const CreditPack = mongoose.models.CreditPack ?? mongoose.model("CreditPack", CreditPackSchema);

// ── Plan seed data ────────────────────────────────────────────────────────────

const PLANS = [
  {
    name: "FREE",
    slug: "free",
    tagline: "Start with free tools — no card needed",
    isActive: true,
    isPopular: false,
    order: 1,
    type: "free",
    pricing: {
      monthly: { basePrice: 0, pricePerCredit: 0, baseCredits: 0, maxCredits: 0, discountPercent: 0 },
      yearly:  { basePrice: 0, pricePerCredit: 0, baseCredits: 0, maxCredits: 0, discountPercent: 0 },
    },
    features: [
      { text: "GST Invoice & QR Tools", included: true, highlight: "" },
      { text: "Hook, Caption & Title Generator", included: true, highlight: "" },
      { text: "10 Welcome Credits (one-time)", included: true, highlight: "" },
      { text: "Basic Dashboard", included: true, highlight: "" },
      { text: "Blog & Script Generator", included: false, highlight: "" },
      { text: "Website Generator", included: false, highlight: "" },
      { text: "Legal & HR Tools", included: false, highlight: "" },
      { text: "Credit Rollover", included: false, highlight: "" },
    ],
    usageExamples: [],
    creditRollover: { enabled: false, maxDays: 30 },
    limits: { toolAccess: "free_only", historyDays: -1, teamSeats: 1 },
  },
  {
    name: "LITE",
    slug: "lite",
    tagline: "Perfect for individuals & freelancers",
    isActive: true,
    isPopular: false,
    order: 2,
    type: "credit",
    pricing: {
      monthly: { basePrice: 399, pricePerCredit: 0, baseCredits: 200, maxCredits: 200, discountPercent: 0 },
      yearly:  { basePrice: 319, pricePerCredit: 0, baseCredits: 200, maxCredits: 200, discountPercent: 20 },
    },
    features: [
      { text: "Everything in Free", included: true, highlight: "" },
      { text: "200 Credits/month", included: true, highlight: "" },
      { text: "Blog Generator", included: true, highlight: "" },
      { text: "YouTube Script Writer", included: true, highlight: "" },
      { text: "Resume Screener & JD Generator", included: true, highlight: "" },
      { text: "Credit Rollover", included: true, highlight: "" },
      { text: "Output History", included: true, highlight: "" },
      { text: "Website Generator", included: false, highlight: "" },
      { text: "Legal & NDA Generator", included: false, highlight: "" },
      { text: "Thumbnail AI", included: false, highlight: "" },
    ],
    usageExamples: [
      "~20 AI blog posts/month",
      "~100 social captions",
      "~10 resume screenings",
    ],
    creditRollover: { enabled: true, maxDays: 30 },
    limits: { toolAccess: "all", historyDays: -1, teamSeats: 1 },
  },
  {
    name: "PRO",
    slug: "pro",
    tagline: "For growing teams and power users",
    isActive: true,
    isPopular: true,
    order: 3,
    type: "credit",
    pricing: {
      monthly: { basePrice: 999, pricePerCredit: 0, baseCredits: 700, maxCredits: 700, discountPercent: 0 },
      yearly:  { basePrice: 799, pricePerCredit: 0, baseCredits: 700, maxCredits: 700, discountPercent: 20 },
    },
    features: [
      { text: "Everything in Lite", included: true, highlight: "" },
      { text: "700 Credits/month", included: true, highlight: "" },
      { text: "Website Generator", included: true, highlight: "" },
      { text: "Legal Notice & NDA Generator", included: true, highlight: "" },
      { text: "Thumbnail AI", included: true, highlight: "" },
      { text: "SEO Auditor", included: true, highlight: "" },
      { text: "Priority Processing", included: true, highlight: "" },
      { text: "Premium Templates", included: true, highlight: "" },
      { text: "API Access", included: true, highlight: "Coming Soon" },
      { text: "Team Features", included: false, highlight: "" },
    ],
    usageExamples: [
      "~40 AI websites/month",
      "~100 SEO blog posts",
      "~300 social posts",
      "~50 legal documents",
    ],
    creditRollover: { enabled: true, maxDays: 30 },
    limits: { toolAccess: "all", historyDays: -1, teamSeats: 1 },
  },
  {
    name: "BUSINESS",
    slug: "business",
    tagline: "High-volume workflows for teams",
    isActive: true,
    isPopular: false,
    order: 4,
    type: "credit",
    pricing: {
      monthly: { basePrice: 2999, pricePerCredit: 0, baseCredits: 1500, maxCredits: 1500, discountPercent: 0 },
      yearly:  { basePrice: 2399, pricePerCredit: 0, baseCredits: 1500, maxCredits: 1500, discountPercent: 20 },
    },
    features: [
      { text: "Everything in Pro", included: true, highlight: "" },
      { text: "1500 Credits/month", included: true, highlight: "" },
      { text: "5 Team Members", included: true, highlight: "Coming Soon" },
      { text: "Shared Workspace", included: true, highlight: "Coming Soon" },
      { text: "Priority Support", included: true, highlight: "" },
      { text: "API Access", included: true, highlight: "Coming Soon" },
      { text: "Advanced Analytics", included: true, highlight: "Coming Soon" },
    ],
    usageExamples: [
      "High-volume AI workflows",
      "Large-scale content generation",
      "~100 websites/month",
    ],
    creditRollover: { enabled: true, maxDays: 60 },
    limits: { toolAccess: "all", historyDays: -1, teamSeats: 5 },
  },
  {
    name: "ENTERPRISE",
    slug: "enterprise",
    tagline: "Custom solution for large teams",
    isActive: true,
    isPopular: false,
    order: 5,
    type: "enterprise",
    pricing: {
      monthly: { basePrice: 0, pricePerCredit: 0, baseCredits: 0, maxCredits: 0, discountPercent: 0 },
      yearly:  { basePrice: 0, pricePerCredit: 0, baseCredits: 0, maxCredits: 0, discountPercent: 0 },
    },
    features: [
      { text: "Unlimited Team Scaling", included: true, highlight: "" },
      { text: "Custom Integrations", included: true, highlight: "" },
      { text: "Dedicated Support", included: true, highlight: "" },
      { text: "SLA Guarantee", included: true, highlight: "" },
      { text: "Custom AI Workflows", included: true, highlight: "" },
      { text: "Private Deployments", included: true, highlight: "" },
      { text: "Invoice Billing", included: true, highlight: "" },
    ],
    usageExamples: [],
    creditRollover: { enabled: false, maxDays: 0 },
    limits: { toolAccess: "all", historyDays: -1, teamSeats: 999 },
  },
];

// ── Credit pack seed data ─────────────────────────────────────────────────────

const CREDIT_PACKS = [
  { name: "Starter",  credits: 50,   price: 149,  pricePerCredit: 2.98, isActive: true, isPopular: false, order: 1 },
  { name: "Growth",   credits: 150,  price: 349,  pricePerCredit: 2.33, isActive: true, isPopular: false, order: 2 },
  { name: "Pro Pack", credits: 400,  price: 799,  pricePerCredit: 2.00, isActive: true, isPopular: true,  order: 3 },
  { name: "Power",    credits: 1000, price: 1799, pricePerCredit: 1.80, isActive: true, isPopular: false, order: 4 },
];

// ── Main ──────────────────────────────────────────────────────────────────────

async function seed() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(uri!);
  console.log("Connected.\n");

  // Remove stale plans not in new set
  const newSlugs = PLANS.map((p) => p.slug);
  const deleted = await Plan.deleteMany({ slug: { $nin: newSlugs } });
  if (deleted.deletedCount > 0) {
    console.log(`  Removed ${deleted.deletedCount} stale plan(s) (e.g. "starter")`);
  }

  // Upsert plans
  for (const plan of PLANS) {
    await Plan.findOneAndUpdate(
      { slug: plan.slug },
      { $set: plan },
      { upsert: true, new: true }
    );
    console.log(`  Plan upserted: ${plan.name} (${plan.slug})`);
  }

  console.log();

  // Remove stale credit packs
  const newPackNames = CREDIT_PACKS.map((p) => p.name);
  const deletedPacks = await CreditPack.deleteMany({ name: { $nin: newPackNames } });
  if (deletedPacks.deletedCount > 0) {
    console.log(`  Removed ${deletedPacks.deletedCount} stale credit pack(s)`);
  }

  // Upsert credit packs by name
  for (const pack of CREDIT_PACKS) {
    await CreditPack.findOneAndUpdate(
      { name: pack.name },
      { $set: pack },
      { upsert: true, new: true }
    );
    console.log(`  CreditPack upserted: ${pack.name} (${pack.credits}cr → ₹${pack.price})`);
  }

  console.log("\nSeed complete.");
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
