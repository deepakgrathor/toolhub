/**
 * Seed plans + credit packs.
 * Run once:
 *   MONGODB_URI="..." npx tsx apps/web/src/scripts/seed-plans.ts
 */

import mongoose from "mongoose";

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI not set");
  process.exit(1);
}

// ── Minimal inline schemas (avoids transpile issues in script context) ────────

const PlanPricingSchema = new mongoose.Schema(
  {
    basePrice: Number,
    pricePerCredit: Number,
    baseCredits: Number,
    maxCredits: Number,
    cashfreePlanId: String,
    discountPercent: { type: Number, default: 30 },
  },
  { _id: false }
);

const PlanFeatureSchema = new mongoose.Schema(
  { text: String, included: { type: Boolean, default: true }, highlight: { type: Boolean, default: false } },
  { _id: false }
);

const PlanSchema = new mongoose.Schema({
  name: String,
  slug: { type: String, unique: true },
  tagline: String,
  isActive: { type: Boolean, default: true },
  isPopular: { type: Boolean, default: false },
  order: Number,
  type: { type: String, enum: ["free", "credit", "enterprise"] },
  pricing: { monthly: PlanPricingSchema, yearly: PlanPricingSchema },
  features: [PlanFeatureSchema],
  creditRollover: { enabled: Boolean, maxDays: Number },
  limits: { toolAccess: String, historyDays: Number, teamSeats: Number },
}, { timestamps: true });

const CreditPackSchema = new mongoose.Schema({
  name: String,
  credits: Number,
  price: Number,
  pricePerCredit: Number,
  isActive: { type: Boolean, default: true },
  isPopular: { type: Boolean, default: false },
  order: Number,
}, { timestamps: true });

const Plan = mongoose.models.Plan ?? mongoose.model("Plan", PlanSchema);
const CreditPack = mongoose.models.CreditPack ?? mongoose.model("CreditPack", CreditPackSchema);

// ── Seed data ─────────────────────────────────────────────────────────────────

const PLANS = [
  {
    name: "FREE",
    slug: "free",
    tagline: "Get started with free tools",
    isActive: true,
    isPopular: false,
    order: 1,
    type: "free",
    pricing: {
      monthly: { basePrice: 0, pricePerCredit: 0, baseCredits: 0, maxCredits: 0 },
      yearly:  { basePrice: 0, pricePerCredit: 0, baseCredits: 0, maxCredits: 0, discountPercent: 0 },
    },
    features: [
      { text: "All free tools (GST, QR, Calculator etc)", included: true, highlight: false },
      { text: "Unlimited usage of free tools", included: true, highlight: false },
      { text: "Basic dashboard", included: true, highlight: false },
      { text: "AI-powered tools", included: false, highlight: false },
      { text: "Credit system", included: false, highlight: false },
    ],
    creditRollover: { enabled: false, maxDays: 30 },
    limits: { toolAccess: "free_only", historyDays: -1, teamSeats: 1 },
  },
  {
    name: "STARTER",
    slug: "starter",
    tagline: "Perfect for individuals and freelancers",
    isActive: true,
    isPopular: false,
    order: 2,
    type: "credit",
    pricing: {
      monthly: { basePrice: 299, pricePerCredit: 2.5, baseCredits: 100, maxCredits: 500 },
      yearly:  { basePrice: 2990, pricePerCredit: 2.0, baseCredits: 100, maxCredits: 500, discountPercent: 30 },
    },
    features: [
      { text: "Everything in Free", included: true, highlight: false },
      { text: "100+ AI credits/month", included: true, highlight: false },
      { text: "All 27 AI tools", included: true, highlight: false },
      { text: "Credit rollover (if enabled)", included: true, highlight: false },
      { text: "Output history", included: true, highlight: false },
      { text: "Priority support", included: true, highlight: false },
    ],
    creditRollover: { enabled: false, maxDays: 30 },
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
      monthly: { basePrice: 799, pricePerCredit: 2.0, baseCredits: 400, maxCredits: 2000 },
      yearly:  { basePrice: 7990, pricePerCredit: 1.5, baseCredits: 400, maxCredits: 2000, discountPercent: 30 },
    },
    features: [
      { text: "Everything in Starter", included: true, highlight: false },
      { text: "400+ AI credits/month", included: true, highlight: false },
      { text: "Priority AI processing", included: true, highlight: false },
      { text: "Advanced analytics", included: true, highlight: false },
      { text: "Team seats (3 included)", included: true, highlight: false },
      { text: "API access (coming soon)", included: true, highlight: false },
      { text: "Best value for teams", included: true, highlight: true },
    ],
    creditRollover: { enabled: false, maxDays: 30 },
    limits: { toolAccess: "all", historyDays: -1, teamSeats: 3 },
  },
  {
    name: "ENTERPRISE",
    slug: "enterprise",
    tagline: "Custom solution for large teams",
    isActive: true,
    isPopular: false,
    order: 4,
    type: "enterprise",
    pricing: {
      monthly: { basePrice: 0, pricePerCredit: 0, baseCredits: 0, maxCredits: 0 },
      yearly:  { basePrice: 0, pricePerCredit: 0, baseCredits: 0, maxCredits: 0, discountPercent: 0 },
    },
    features: [
      { text: "Everything in Pro", included: true, highlight: false },
      { text: "Unlimited credits", included: true, highlight: false },
      { text: "Dedicated support", included: true, highlight: false },
      { text: "Custom integrations", included: true, highlight: false },
      { text: "SLA guarantee", included: true, highlight: false },
      { text: "Invoice billing", included: true, highlight: false },
      { text: "Custom AI fine-tuning", included: true, highlight: false },
    ],
    creditRollover: { enabled: false, maxDays: 30 },
    limits: { toolAccess: "all", historyDays: -1, teamSeats: 999 },
  },
];

const CREDIT_PACKS = [
  { name: "Basic",   credits: 100, price: 149, pricePerCredit: 1.49, isActive: true, isPopular: false, order: 1 },
  { name: "Popular", credits: 300, price: 399, pricePerCredit: 1.33, isActive: true, isPopular: true,  order: 2 },
  { name: "Pro",     credits: 700, price: 899, pricePerCredit: 1.28, isActive: true, isPopular: false, order: 3 },
];

// ── Main ──────────────────────────────────────────────────────────────────────

async function seed() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(uri!);
  console.log("Connected.");

  // Upsert plans
  for (const plan of PLANS) {
    await Plan.findOneAndUpdate(
      { slug: plan.slug },
      { $set: plan },
      { upsert: true, new: true }
    );
    console.log(`  Plan upserted: ${plan.name}`);
  }

  // Upsert credit packs by name
  for (const pack of CREDIT_PACKS) {
    await CreditPack.findOneAndUpdate(
      { name: pack.name },
      { $set: pack },
      { upsert: true, new: true }
    );
    console.log(`  CreditPack upserted: ${pack.name}`);
  }

  console.log("Seed complete.");
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
