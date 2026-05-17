// /**
//  * Seed plans + credit packs (SetuLix production pricing).
//  * Run: MONGODB_URI="..." npx tsx apps/web/src/scripts/seed-plans.ts
//  * Safe to re-run — uses upsert by slug / name.
//  *
//  * Last updated: Feature matrix v2
//  * Plans    → FREE / LITE / PRO / BUSINESS / ENTERPRISE
//  * Packs    → 8 one-time credit packs (₹2.98 → ₹1.40 per credit)
//  */ 

// import mongoose from "mongoose";

// const uri = process.env.MONGODB_URI;
// if (!uri) {
//   console.error("MONGODB_URI not set");
//   process.exit(1);
// }

// // ── Minimal inline schemas ────────────────────────────────────────────────────

// const PlanPricingSchema = new mongoose.Schema(
//   {
//     basePrice: { type: Number, default: 0 },
//     pricePerCredit: { type: Number, default: 0 },
//     baseCredits: { type: Number, default: 0 },
//     maxCredits: { type: Number, default: 0 },
//     cashfreePlanId: { type: String },
//     discountPercent: { type: Number, default: 0 },
//   },
//   { _id: false },
// );

// const PlanFeatureSchema = new mongoose.Schema(
//   {
//     text: String,
//     included: { type: Boolean, default: true },
//     highlight: { type: String, default: "" }, // e.g. "Coming Soon"
//   },
//   { _id: false },
// );

// const PlanLimitsSchema = new mongoose.Schema(
//   {
//     toolAccess: String, // "all" | "free_only"
//     historyDays: Number, // -1 = unlimited, 0 = none
//     teamSeats: Number,
//     businessProfiles: Number,
//     savedPresets: Number, // -1 = unlimited
//     creditRolloverMonths: Number, // 0 = no rollover
//     watermark: Boolean,
//     pdfDownload: String, // "none" | "branded" | "whitelabel"
//     customUrl: Boolean,
//     usageReport: Boolean,
//     prioritySupport: Boolean,
//   },
//   { _id: false },
// );

// const PlanSchema = new mongoose.Schema(
//   {
//     name: String,
//     slug: { type: String, unique: true },
//     tagline: String,
//     isActive: { type: Boolean, default: true },
//     isPopular: { type: Boolean, default: false },
//     order: Number,
//     type: { type: String, enum: ["free", "credit", "enterprise"] },
//     pricing: { monthly: PlanPricingSchema, yearly: PlanPricingSchema },
//     features: [PlanFeatureSchema],
//     usageExamples: [String],
//     limits: PlanLimitsSchema,
//   },
//   { timestamps: true },
// );

// const CreditPackSchema = new mongoose.Schema(
//   {
//     name: String,
//     credits: Number,
//     price: Number,
//     pricePerCredit: Number,
//     savingsPercent: Number, // vs Starter (₹2.98 base)
//     tagline: String, // e.g. "Try karo" / "SME sweet spot"
//     isActive: { type: Boolean, default: true },
//     isPopular: { type: Boolean, default: false },
//     order: Number,
//   },
//   { timestamps: true },
// );

// const Plan = mongoose.models.Plan ?? mongoose.model("Plan", PlanSchema);
// const CreditPack =
//   mongoose.models.CreditPack ?? mongoose.model("CreditPack", CreditPackSchema);

// // ── Plan seed data ────────────────────────────────────────────────────────────

// const PLANS = [
//   // ── FREE ──────────────────────────────────────────────────────────────────
//   {
//     name: "FREE",
//     slug: "free",
//     tagline: "Start exploring — no card needed",
//     isActive: true,
//     isPopular: false,
//     order: 1,
//     type: "free",
//     pricing: {
//       monthly: {
//         basePrice: 0,
//         pricePerCredit: 0,
//         baseCredits: 0,
//         maxCredits: 0,
//         discountPercent: 0,
//       },
//       yearly: {
//         basePrice: 0,
//         pricePerCredit: 0,
//         baseCredits: 0,
//         maxCredits: 0,
//         discountPercent: 0,
//       },
//     },
//     features: [
//       { text: "10 welcome credits (one-time)", included: true, highlight: "" },
//       { text: "All tools accessible", included: true, highlight: "" },
//       { text: "Earn credits via referrals", included: true, highlight: "" },
//       { text: "Watermark on AI outputs", included: true, highlight: "" },
//       { text: "No output history", included: false, highlight: "" },
//       { text: "No credit rollover", included: false, highlight: "" },
//       { text: "No PDF download", included: false, highlight: "" },
//       { text: "No saved presets", included: false, highlight: "" },
//       { text: "No business profiles", included: false, highlight: "" },
//     ],
//     usageExamples: [
//       "~3 AI tasks with welcome credits",
//       "Earn more credits by referring friends",
//       "No card required to start",
//     ],
//     limits: {
//       toolAccess: "all",
//       historyDays: 0,
//       teamSeats: 1,
//       businessProfiles: 0,
//       savedPresets: 0,
//       creditRolloverMonths: 0,
//       watermark: true,
//       pdfDownload: "none",
//       customUrl: false,
//       usageReport: false,
//       prioritySupport: false,
//     },
//   },

//   // ── LITE ──────────────────────────────────────────────────────────────────
//   {
//     name: "LITE",
//     slug: "lite",
//     tagline: "Perfect for individuals & freelancers",
//     isActive: true,
//     isPopular: false,
//     order: 2,
//     type: "credit",
//     pricing: {
//       monthly: {
//         basePrice: 399,
//         pricePerCredit: 0,
//         baseCredits: 200,
//         maxCredits: 200,
//         discountPercent: 0,
//       },
//       yearly: {
//         basePrice: 319,
//         pricePerCredit: 0,
//         baseCredits: 200,
//         maxCredits: 200,
//         discountPercent: 20,
//       },
//     },
//     features: [
//       { text: "200 credits/month", included: true, highlight: "" },
//       { text: "All tools accessible", included: true, highlight: "" },
//       { text: "1 month credit rollover", included: true, highlight: "" },
//       { text: "30 day output history", included: true, highlight: "" },
//       { text: "No watermark", included: true, highlight: "" },
//       { text: "PDF download (SetuLix branded)", included: true, highlight: "" },
//       { text: "1 business profile", included: true, highlight: "" },
//       { text: "Autofill from profile", included: true, highlight: "" },
//       { text: "Saved presets", included: false, highlight: "PRO only" },
//       { text: "White-label PDF", included: false, highlight: "BUSINESS only" },
//     ],
//     usageExamples: [
//       "~65 AI tasks every month",
//       "~65 blog posts or social captions",
//       "~25 job descriptions or HR policies",
//       "~8 legal notices or NDAs",
//     ],
//     limits: {
//       toolAccess: "all",
//       historyDays: 30,
//       teamSeats: 1,
//       businessProfiles: 1,
//       savedPresets: 0,
//       creditRolloverMonths: 1,
//       watermark: false,
//       pdfDownload: "branded",
//       customUrl: false,
//       usageReport: false,
//       prioritySupport: false,
//     },
//   },

//   // ── PRO ───────────────────────────────────────────────────────────────────
//   {
//     name: "PRO",
//     slug: "pro",
//     tagline: "For growing teams and power users",
//     isActive: true,
//     isPopular: true,
//     order: 3,
//     type: "credit",
//     pricing: {
//       monthly: {
//         basePrice: 999,
//         pricePerCredit: 0,
//         baseCredits: 700,
//         maxCredits: 700,
//         discountPercent: 0,
//       },
//       yearly: {
//         basePrice: 799,
//         pricePerCredit: 0,
//         baseCredits: 700,
//         maxCredits: 700,
//         discountPercent: 20,
//       },
//     },
//     features: [
//       { text: "700 credits/month", included: true, highlight: "" },
//       { text: "Everything in Lite", included: true, highlight: "" },
//       { text: "2 month credit rollover", included: true, highlight: "" },
//       { text: "90 day output history", included: true, highlight: "" },
//       { text: "3 business profiles", included: true, highlight: "" },
//       { text: "5 saved presets per tool", included: true, highlight: "" },
//       {
//         text: "Branded PDF (logo + letterhead)",
//         included: true,
//         highlight: "",
//       },
//       { text: "Faster AI responses", included: true, highlight: "" },
//       { text: "Premium templates", included: true, highlight: "" },
//       { text: "API access", included: true, highlight: "Coming Soon" },
//       { text: "Bulk generation", included: false, highlight: "Coming Soon" },
//       { text: "Team features", included: false, highlight: "Coming Soon" },
//     ],
//     usageExamples: [
//       "~230 AI tasks every month",
//       "~115 blog posts or 230 social captions",
//       "~87 job descriptions, policies, or appraisals",
//       "~46 legal notices or full SEO audits",
//       "~46 complete AI website generations",
//     ],
//     limits: {
//       toolAccess: "all",
//       historyDays: 90,
//       teamSeats: 1,
//       businessProfiles: 3,
//       savedPresets: 5,
//       creditRolloverMonths: 2,
//       watermark: false,
//       pdfDownload: "branded",
//       customUrl: false,
//       usageReport: false,
//       prioritySupport: false,
//     },
//   },

//   // ── BUSINESS ──────────────────────────────────────────────────────────────
//   {
//     name: "BUSINESS",
//     slug: "business",
//     tagline: "High-volume workflows for teams",
//     isActive: true,
//     isPopular: false,
//     order: 4,
//     type: "credit",
//     pricing: {
//       monthly: {
//         basePrice: 2999,
//         pricePerCredit: 0,
//         baseCredits: 1500,
//         maxCredits: 1500,
//         discountPercent: 0,
//       },
//       yearly: {
//         basePrice: 2399,
//         pricePerCredit: 0,
//         baseCredits: 1500,
//         maxCredits: 1500,
//         discountPercent: 20,
//       },
//     },
//     features: [
//       { text: "1500 credits/month", included: true, highlight: "" },
//       { text: "Everything in Pro", included: true, highlight: "" },
//       { text: "3 month credit rollover", included: true, highlight: "" },
//       { text: "1 year output history", included: true, highlight: "" },
//       { text: "10 business profiles", included: true, highlight: "" },
//       { text: "Unlimited saved presets", included: true, highlight: "" },
//       {
//         text: "White-label PDF (client branding)",
//         included: true,
//         highlight: "",
//       },
//       { text: "Custom business URL", included: true, highlight: "" },
//       { text: "Monthly usage report", included: true, highlight: "" },
//       { text: "Priority support", included: true, highlight: "" },
//       { text: "5 team seats", included: true, highlight: "Coming Soon" },
//       { text: "Advanced analytics", included: true, highlight: "Coming Soon" },
//       { text: "API access", included: true, highlight: "Coming Soon" },
//     ],
//     usageExamples: [
//       "~500 AI tasks every month",
//       "~250 blog posts or 500 social captions",
//       "~187 job descriptions, policies, or appraisals",
//       "~100 legal notices or complete website builds",
//       "High-volume content workflows for teams",
//     ],
//     limits: {
//       toolAccess: "all",
//       historyDays: 365,
//       teamSeats: 5,
//       businessProfiles: 10,
//       savedPresets: -1,
//       creditRolloverMonths: 3,
//       watermark: false,
//       pdfDownload: "whitelabel",
//       customUrl: true,
//       usageReport: true,
//       prioritySupport: true,
//     },
//   },

//   // ── ENTERPRISE ────────────────────────────────────────────────────────────
//   {
//     name: "ENTERPRISE",
//     slug: "enterprise",
//     tagline: "Custom solution for large teams",
//     isActive: true,
//     isPopular: false,
//     order: 5,
//     type: "enterprise",
//     pricing: {
//       monthly: {
//         basePrice: 0,
//         pricePerCredit: 0,
//         baseCredits: 0,
//         maxCredits: 0,
//         discountPercent: 0,
//       },
//       yearly: {
//         basePrice: 0,
//         pricePerCredit: 0,
//         baseCredits: 0,
//         maxCredits: 0,
//         discountPercent: 0,
//       },
//     },
//     features: [
//       { text: "Custom credits & pricing", included: true, highlight: "" },
//       { text: "Unlimited team scaling", included: true, highlight: "" },
//       { text: "Custom AI workflows", included: true, highlight: "" },
//       { text: "White-label deployment", included: true, highlight: "" },
//       { text: "Dedicated account manager", included: true, highlight: "" },
//       { text: "SLA guarantee", included: true, highlight: "" },
//       { text: "Custom integrations", included: true, highlight: "" },
//       { text: "Invoice billing", included: true, highlight: "" },
//       { text: "Private deployment option", included: true, highlight: "" },
//     ],
//     usageExamples: [],
//     limits: {
//       toolAccess: "all",
//       historyDays: -1,
//       teamSeats: 999,
//       businessProfiles: -1,
//       savedPresets: -1,
//       creditRolloverMonths: -1,
//       watermark: false,
//       pdfDownload: "whitelabel",
//       customUrl: true,
//       usageReport: true,
//       prioritySupport: true,
//     },
//   },
// ];

// // ── Credit pack seed data ─────────────────────────────────────────────────────
// // Base rate: ₹2.98/credit (Starter)
// // Each pack is consistently cheaper per credit as volume increases.

// const CREDIT_PACKS = [
//   {
//     name: "Starter",
//     credits: 50,
//     price: 149,
//     pricePerCredit: 2.98,
//     savingsPercent: 0,
//     tagline: "Try karo",
//     isActive: true,
//     isPopular: false,
//     order: 1,
//   },
//   {
//     name: "Basic",
//     credits: 100,
//     price: 269,
//     pricePerCredit: 2.69,
//     savingsPercent: 10,
//     tagline: "Light user",
//     isActive: true,
//     isPopular: false,
//     order: 2,
//   },
//   {
//     name: "Standard",
//     credits: 200,
//     price: 499,
//     pricePerCredit: 2.5,
//     savingsPercent: 16,
//     tagline: "Regular use",
//     isActive: true,
//     isPopular: false,
//     order: 3,
//   },
//   {
//     name: "Growth",
//     credits: 500,
//     price: 999,
//     pricePerCredit: 2.0,
//     savingsPercent: 33,
//     tagline: "SME sweet spot",
//     isActive: true,
//     isPopular: true,
//     order: 4,
//   },
//   {
//     name: "Pro",
//     credits: 750,
//     price: 1349,
//     pricePerCredit: 1.8,
//     savingsPercent: 40,
//     tagline: "Power user",
//     isActive: true,
//     isPopular: false,
//     order: 5,
//   },
//   {
//     name: "Business",
//     credits: 1000,
//     price: 1699,
//     pricePerCredit: 1.7,
//     savingsPercent: 43,
//     tagline: "Agency / CA firm",
//     isActive: true,
//     isPopular: false,
//     order: 6,
//   },
//   {
//     name: "Elite",
//     credits: 1500,
//     price: 2249,
//     pricePerCredit: 1.5,
//     savingsPercent: 50,
//     tagline: "Heavy agency",
//     isActive: true,
//     isPopular: false,
//     order: 7,
//   },
//   {
//     name: "Power",
//     credits: 2000,
//     price: 2799,
//     pricePerCredit: 1.4,
//     savingsPercent: 53,
//     tagline: "Enterprise / IT firms",
//     isActive: true,
//     isPopular: false,
//     order: 8,
//   },
// ];

// // ── Main ──────────────────────────────────────────────────────────────────────

// async function seed() {
//   console.log("Connecting to MongoDB...");
//   await mongoose.connect(uri!);
//   console.log("Connected.\n");

//   // ── Plans ──
//   const newSlugs = PLANS.map((p) => p.slug);
//   const deletedPlans = await Plan.deleteMany({ slug: { $nin: newSlugs } });
//   if (deletedPlans.deletedCount > 0) {
//     console.log(`  Removed ${deletedPlans.deletedCount} stale plan(s)`);
//   }

//   for (const plan of PLANS) {
//     await Plan.findOneAndUpdate(
//       { slug: plan.slug },
//       { $set: plan },
//       { upsert: true, new: true },
//     );
//     console.log(`  Plan upserted: ${plan.name} (${plan.slug})`);
//   }

//   console.log();

//   // ── Credit Packs ──
//   const newPackNames = CREDIT_PACKS.map((p) => p.name);
//   const deletedPacks = await CreditPack.deleteMany({
//     name: { $nin: newPackNames },
//   });
//   if (deletedPacks.deletedCount > 0) {
//     console.log(`  Removed ${deletedPacks.deletedCount} stale credit pack(s)`);
//   }

//   for (const pack of CREDIT_PACKS) {
//     await CreditPack.findOneAndUpdate(
//       { name: pack.name },
//       { $set: pack },
//       { upsert: true, new: true },
//     );
//     console.log(
//       `  CreditPack upserted: ${pack.name} (${pack.credits}cr → ₹${pack.price} @ ₹${pack.pricePerCredit}/cr)`,
//     );
//   }

//   console.log("\nSeed complete ✓");
//   await mongoose.disconnect();
// }

// seed().catch((err) => {
//   console.error("Seed failed:", err);
//   process.exit(1);
// });
