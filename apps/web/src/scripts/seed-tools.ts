/**
 * Seed tool credit costs (B6 locked credit assignments).
 * Run: MONGODB_URI="..." npx tsx apps/web/src/scripts/seed-tools.ts
 * Safe to re-run — uses upsert by toolSlug.
 */

import mongoose from "mongoose";

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI not set");
  process.exit(1);
}

const ToolConfigSchema = new mongoose.Schema(
  {
    toolSlug: { type: String, unique: true },
    creditCost: { type: Number, default: 0 },
    aiModel: { type: String, default: "gpt-4o-mini" },
    aiProvider: { type: String, default: "openai" },
    isActive: { type: Boolean, default: true },
    isVisible: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const ToolConfig =
  mongoose.models.ToolConfig ?? mongoose.model("ToolConfig", ToolConfigSchema);

// ── Locked credit assignments (B6) ───────────────────────────────────────────

const TOOL_CREDITS: { toolSlug: string; creditCost: number }[] = [
  // 1 credit
  { toolSlug: "hook-writer",       creditCost: 1 },
  { toolSlug: "caption-generator", creditCost: 1 },
  { toolSlug: "title-generator",   creditCost: 1 },
  { toolSlug: "email-subject",     creditCost: 1 },
  { toolSlug: "whatsapp-bulk",     creditCost: 1 },
  // 2 credits
  { toolSlug: "jd-generator",      creditCost: 2 },
  // 3 credits
  { toolSlug: "blog-generator",    creditCost: 3 },
  { toolSlug: "resume-screener",   creditCost: 3 },
  { toolSlug: "appraisal-draft",   creditCost: 3 },
  { toolSlug: "policy-generator",  creditCost: 3 },
  { toolSlug: "ad-copy",           creditCost: 3 },
  { toolSlug: "linkedin-bio",      creditCost: 3 },
  { toolSlug: "legal-disclaimer",  creditCost: 3 },
  // 4 credits
  { toolSlug: "yt-script",         creditCost: 4 },
  // 8 credits
  { toolSlug: "seo-auditor",       creditCost: 8 },
  { toolSlug: "legal-notice",      creditCost: 8 },
  // 10 credits
  { toolSlug: "thumbnail-ai",      creditCost: 10 },
  { toolSlug: "nda-generator",     creditCost: 10 },
  // 25 credits
  { toolSlug: "website-generator", creditCost: 25 },
  // 0 credits (client-side tools)
  { toolSlug: "qr-generator",      creditCost: 0 },
  { toolSlug: "gst-calculator",    creditCost: 0 },
  { toolSlug: "gst-invoice",       creditCost: 0 },
  { toolSlug: "expense-tracker",   creditCost: 0 },
  { toolSlug: "quotation-generator", creditCost: 0 },
  { toolSlug: "salary-slip",       creditCost: 0 },
  { toolSlug: "offer-letter",      creditCost: 0 },
  { toolSlug: "tds-sheet",         creditCost: 0 },
];

async function seed() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(uri!);
  console.log("Connected.\n");

  for (const { toolSlug, creditCost } of TOOL_CREDITS) {
    await ToolConfig.findOneAndUpdate(
      { toolSlug },
      { $set: { creditCost } },
      { upsert: true, new: true }
    );
    console.log(`  ToolConfig upserted: ${toolSlug} → ${creditCost} cr`);
  }

  console.log("\nSeed complete.");
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
