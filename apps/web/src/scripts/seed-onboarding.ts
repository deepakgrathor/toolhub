/**
 * Run once to seed OnboardingConfig collection with default steps.
 * Usage: MONGODB_URI="..." npx tsx apps/web/src/scripts/seed-onboarding.ts
 */

import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("MONGODB_URI is required");
  process.exit(1);
}

const OnboardingConfigSchema = new mongoose.Schema({
  step: Number,
  question: String,
  subtitle: String,
  type: String,
  field: String,
  options: [
    {
      value: String,
      label: String,
      icon: String,
      subtitle: String,
      kitName: String,
    },
  ],
  isActive: { type: Boolean, default: true },
  order: Number,
});

const OnboardingConfig =
  mongoose.models.OnboardingConfig ??
  mongoose.model("OnboardingConfig", OnboardingConfigSchema);

const DEFAULT_STEPS = [
  {
    step: 1,
    question: "Aap mainly kya karte hain?",
    subtitle: "Hum aapka AI workspace personalise karenge.",
    type: "single_select",
    field: "profession",
    order: 1,
    options: [
      { value: "creator",  label: "Content Creator",  icon: "Sparkles",   subtitle: "Scripts, thumbnails, hooks", kitName: "{name} Creator Pro" },
      { value: "sme",      label: "Business Owner",   icon: "Building2",  subtitle: "GST invoice, quotation",     kitName: "{name} Business Hub" },
      { value: "hr",       label: "HR Professional",  icon: "Users",      subtitle: "JD, offer letter, appraisal",kitName: "{name} HR Suite" },
      { value: "legal",    label: "CA / Legal Pro",   icon: "Scale",      subtitle: "Legal notices, NDAs",        kitName: "{name} Legal Pro" },
      { value: "marketer", label: "Marketer",         icon: "Megaphone",  subtitle: "Ad copy, LinkedIn bio",      kitName: "{name} Marketing Pro" },
      { value: "other",    label: "Something Else",   icon: "HelpCircle", subtitle: "Explore all 27 tools",       kitName: "{name} AI Workspace" },
    ],
  },
  {
    step: 2,
    question: "Aapki team kitni badi hai?",
    subtitle: "Hum sahi tools suggest karenge.",
    type: "single_select",
    field: "teamSize",
    order: 2,
    options: [
      { value: "solo",  label: "Solo",  icon: "User",     subtitle: "Just me" },
      { value: "2-10",  label: "2-10",  icon: "Users2",   subtitle: "Small team" },
      { value: "11-50", label: "11-50", icon: "Building", subtitle: "Growing team" },
      { value: "50+",   label: "50+",   icon: "Briefcase",subtitle: "Large org" },
    ],
  },
  {
    step: 3,
    question: "Aapki sabse badi problem kya hai?",
    subtitle: "Hum iske hisaab se tools recommend karenge.",
    type: "single_select",
    field: "challenge",
    order: 3,
    options: [
      { value: "time",       label: "Time Saving",         icon: "Clock",      subtitle: "Automate repetitive tasks" },
      { value: "quality",    label: "Quality Improvement",  icon: "Star",       subtitle: "Better output every time" },
      { value: "cost",       label: "Cost Reduction",       icon: "DollarSign", subtitle: "Do more with less" },
      { value: "compliance", label: "Compliance & Legal",   icon: "ShieldCheck",subtitle: "Stay audit-ready" },
    ],
  },
  {
    step: 4,
    question: "Aapka personalized workspace ready hai!",
    subtitle: "Workspace naam edit kar sakte ho.",
    type: "text",
    field: "kitName",
    order: 4,
    options: [],
  },
];

async function seed() {
  await mongoose.connect(MONGODB_URI!);
  console.log("Connected to MongoDB");

  for (const step of DEFAULT_STEPS) {
    await OnboardingConfig.findOneAndUpdate(
      { step: step.step },
      step,
      { upsert: true }
    );
    console.log(`Seeded step ${step.step}: ${step.question}`);
  }

  await mongoose.disconnect();
  console.log("Done! OnboardingConfig seeded.");
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
