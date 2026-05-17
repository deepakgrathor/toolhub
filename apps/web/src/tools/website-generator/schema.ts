import { z } from "zod";

// ── Testimonials ─────────────────────────────────────────────────────────────

const TestimonialItemSchema = z.object({
  name: z.string().min(1),
  role: z.string().min(1),
  review: z.string().min(1),
  rating: z.number().int().min(1).max(5),
});

// ── Pricing ──────────────────────────────────────────────────────────────────

const PricingPlanSchema = z.object({
  name: z.string().min(1),
  price: z.string().min(1),
  features: z.array(z.string()),
  highlighted: z.boolean().default(false),
});

// ── FAQ ───────────────────────────────────────────────────────────────────────

const FaqItemSchema = z.object({
  question: z.string().min(1),
  answer: z.string().min(1),
});

// ── Team ──────────────────────────────────────────────────────────────────────

const TeamMemberSchema = z.object({
  name: z.string().min(1),
  role: z.string().min(1),
  bio: z.string().optional(),
});

// ── Social ────────────────────────────────────────────────────────────────────

const SocialLinksSchema = z.object({
  instagram: z.string().optional(),
  facebook: z.string().optional(),
  linkedin: z.string().optional(),
  twitter: z.string().optional(),
  youtube: z.string().optional(),
});

// ── Sections ──────────────────────────────────────────────────────────────────

const SectionsSchema = z.object({
  testimonials: z.boolean().default(false),
  testimonialsMode: z.enum(["auto", "manual"]).default("auto"),
  testimonialsList: z.array(TestimonialItemSchema).optional(),

  pricing: z.boolean().default(false),
  pricingPlans: z.array(PricingPlanSchema).optional(),

  faq: z.boolean().default(false),
  faqMode: z.enum(["auto", "manual"]).default("auto"),
  faqList: z.array(FaqItemSchema).optional(),

  team: z.boolean().default(false),
  teamMembers: z.array(TeamMemberSchema).optional(),

  whatsapp: z.boolean().default(false),
  whatsappNumber: z.string().optional(),
  whatsappText: z.string().optional(),

  maps: z.boolean().default(false),
  mapsQuery: z.string().optional(),

  social: z.boolean().default(false),
  socialLinks: SocialLinksSchema.optional(),
});

// ── Main schema ───────────────────────────────────────────────────────────────

export const websiteGeneratorSchema = z.object({
  // Step 1 — Business Info
  businessName: z.string().min(2).max(100),
  businessType: z.string().min(3).max(100),
  description: z.string().min(20).max(500),
  targetAudience: z.string().min(5).max(200),
  keyServices: z.string().min(10).max(300),
  language: z.enum(["english", "hindi", "hinglish"]).default("english"),
  includeContact: z.boolean().default(true),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),

  // Step 2 — Goals (optional until Feat-1B form replaces the current UI)
  websiteGoal: z.enum(["get_leads", "showcase_work", "sell_products", "build_trust"]).optional(),
  tone: z.enum(["professional", "friendly", "bold", "luxury"]).optional(),

  // Step 3 — Pages & Sections
  pages: z.enum(["1", "2", "3", "4"]).default("1"),
  sections: SectionsSchema.default({}),

  // Step 4 — Design
  colorScheme: z.enum(["blue", "green", "purple", "red", "orange", "dark"]),
  style: z.enum(["modern", "minimal", "corporate", "creative"]),
  animation: z.boolean().default(false),
  darkMode: z.boolean().default(false),

  // Step 5 — Extras
  logoBase64: z.string().optional(),
  logoFileName: z.string().optional(),
});

export type WebsiteGeneratorInput = z.infer<typeof websiteGeneratorSchema>;
