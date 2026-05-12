import { connectDB, disconnectDB } from "./connection";
import { Tool } from "./models/Tool";
import { ToolConfig } from "./models/ToolConfig";
import { CreditPack } from "./models/CreditPack";
import { SiteConfig } from "./models/SiteConfig";

// ── Tool definitions ────────────────────────────────────────────────────────

interface ToolSeed {
  slug: string;
  name: string;
  description: string;
  category: string;
  kits: string[];
  isAI: boolean;
  isFree: boolean;
  icon: string;
}

const TOOLS: ToolSeed[] = [
  // CREATOR KIT
  {
    slug: "yt-script",
    name: "YT Script Writer",
    description:
      "Generate engaging YouTube video scripts with AI — intro, body, and CTA included.",
    category: "Content Creation",
    kits: ["creator"],
    isAI: true,
    isFree: false,
    icon: "Video",
  },
  {
    slug: "blog-generator",
    name: "Blog Generator",
    description:
      "Write SEO-optimised blog posts in seconds. Pick tone, length, and keywords.",
    category: "Content Creation",
    kits: ["creator", "marketing"],
    isAI: true,
    isFree: false,
    icon: "FileText",
  },
  {
    slug: "thumbnail-ai",
    name: "Thumbnail AI",
    description:
      "Generate eye-catching YouTube thumbnail ideas with AI-powered visuals.",
    category: "Content Creation",
    kits: ["creator"],
    isAI: true,
    isFree: false,
    icon: "Image",
  },
  {
    slug: "title-generator",
    name: "Title Generator",
    description:
      "Create click-worthy titles for videos, blogs, and social posts in one click.",
    category: "Content Creation",
    kits: ["creator"],
    isAI: true,
    isFree: false,
    icon: "Heading",
  },
  {
    slug: "hook-writer",
    name: "Hook Writer",
    description:
      "Write powerful opening hooks that grab attention instantly — free tool.",
    category: "Content Creation",
    kits: ["creator"],
    isAI: false,
    isFree: true,
    icon: "Zap",
  },
  {
    slug: "caption-generator",
    name: "Caption Generator",
    description:
      "Generate social media captions with hashtags in seconds — free tool.",
    category: "Content Creation",
    kits: ["creator"],
    isAI: false,
    isFree: true,
    icon: "MessageSquare",
  },

  // SME KIT
  {
    slug: "gst-invoice",
    name: "GST Invoice Generator",
    description:
      "Create professional GST-compliant invoices instantly — free, no login required.",
    category: "Business Documents",
    kits: ["sme"],
    isAI: false,
    isFree: true,
    icon: "Receipt",
  },
  {
    slug: "expense-tracker",
    name: "Expense Tracker",
    description:
      "Track and categorise business expenses, export to PDF or CSV — free tool.",
    category: "Finance",
    kits: ["sme"],
    isAI: false,
    isFree: true,
    icon: "Wallet",
  },
  {
    slug: "quotation-generator",
    name: "Quotation Generator",
    description:
      "Generate branded quotations for clients in seconds — free tool.",
    category: "Business Documents",
    kits: ["sme"],
    isAI: false,
    isFree: true,
    icon: "ClipboardList",
  },
  {
    slug: "website-generator",
    name: "Website Generator",
    description:
      "AI builds a complete business website from your company details in minutes.",
    category: "Business Tools",
    kits: ["sme"],
    isAI: true,
    isFree: false,
    icon: "Globe",
  },
  {
    slug: "qr-generator",
    name: "QR Generator",
    description:
      "Generate QR codes for URLs, payments, and contact details — free tool.",
    category: "Utilities",
    kits: ["sme"],
    isAI: false,
    isFree: true,
    icon: "QrCode",
  },
  {
    slug: "whatsapp-bulk",
    name: "WhatsApp Bulk Message",
    description:
      "Draft personalised bulk WhatsApp messages for your customer list using AI.",
    category: "Marketing",
    kits: ["sme", "marketing"],
    isAI: true,
    isFree: false,
    icon: "MessageCircle",
  },
  {
    slug: "salary-slip",
    name: "Salary Slip Generator",
    description:
      "Generate professional salary slips with all components — free tool.",
    category: "HR Documents",
    kits: ["hr"],
    isAI: false,
    isFree: true,
    icon: "Banknote",
  },

  // HR KIT
  {
    slug: "resume-screener",
    name: "Resume Screener",
    description:
      "AI screens resumes against your JD and ranks candidates with fit scores.",
    category: "Recruitment",
    kits: ["hr"],
    isAI: true,
    isFree: false,
    icon: "FileSearch",
  },
  {
    slug: "jd-generator",
    name: "JD Generator",
    description:
      "Create detailed, unbiased job descriptions for any role using AI.",
    category: "Recruitment",
    kits: ["hr"],
    isAI: true,
    isFree: false,
    icon: "Briefcase",
  },
  {
    slug: "offer-letter",
    name: "Offer Letter Generator",
    description:
      "Generate professional offer letters with all standard clauses — free tool.",
    category: "HR Documents",
    kits: ["hr"],
    isAI: false,
    isFree: true,
    icon: "Mail",
  },
  {
    slug: "appraisal-draft",
    name: "Appraisal Draft",
    description:
      "AI drafts fair, structured performance appraisal documents for employees.",
    category: "HR Documents",
    kits: ["hr"],
    isAI: true,
    isFree: false,
    icon: "TrendingUp",
  },
  {
    slug: "policy-generator",
    name: "Policy Generator",
    description:
      "Generate HR policy documents (leave, remote work, etc.) tailored to your org.",
    category: "HR Documents",
    kits: ["hr"],
    isAI: true,
    isFree: false,
    icon: "Shield",
  },

  // CA / LEGAL KIT
  {
    slug: "gst-calculator",
    name: "GST Calculator",
    description:
      "Quickly calculate GST for any amount with all slabs — free tool.",
    category: "Finance",
    kits: ["ca-legal"],
    isAI: false,
    isFree: true,
    icon: "Calculator",
  },
  {
    slug: "tds-sheet",
    name: "TDS Sheet",
    description:
      "Generate TDS deduction sheets for your employees or vendors — free tool.",
    category: "Finance",
    kits: ["ca-legal"],
    isAI: false,
    isFree: true,
    icon: "Table2",
  },
  {
    slug: "legal-notice",
    name: "Legal Notice Draft",
    description:
      "AI drafts legally sound notices for consumer, employment, or property matters.",
    category: "Legal",
    kits: ["ca-legal"],
    isAI: true,
    isFree: false,
    icon: "Gavel",
  },
  {
    slug: "nda-generator",
    name: "NDA Generator",
    description:
      "Generate a complete Non-Disclosure Agreement tailored to your requirements.",
    category: "Legal",
    kits: ["ca-legal"],
    isAI: true,
    isFree: false,
    icon: "Lock",
  },
  {
    slug: "legal-disclaimer",
    name: "Legal Disclaimer",
    description:
      "AI creates custom legal disclaimers for websites, apps, and documents.",
    category: "Legal",
    kits: ["ca-legal"],
    isAI: true,
    isFree: false,
    icon: "AlertCircle",
  },

  // MARKETING KIT
  {
    slug: "email-subject",
    name: "Email Subject Line",
    description:
      "Generate high open-rate email subject lines for any campaign using AI.",
    category: "Marketing",
    kits: ["marketing"],
    isAI: true,
    isFree: false,
    icon: "AtSign",
  },
  {
    slug: "linkedin-bio",
    name: "LinkedIn Bio",
    description:
      "AI writes a compelling LinkedIn profile bio that gets you noticed.",
    category: "Marketing",
    kits: ["marketing"],
    isAI: true,
    isFree: false,
    icon: "Linkedin",
  },
  {
    slug: "seo-auditor",
    name: "SEO Website Auditor",
    description:
      "Deep AI audit of your website — technical SEO, content gaps, and fixes.",
    category: "Marketing",
    kits: ["marketing"],
    isAI: true,
    isFree: false,
    icon: "BarChart2",
  },
  {
    slug: "ad-copy",
    name: "Ad Copy Writer",
    description:
      "AI writes Google, Facebook, and Instagram ad copy that converts.",
    category: "Marketing",
    kits: ["marketing"],
    isAI: true,
    isFree: false,
    icon: "BadgeDollarSign",
  },
];

// ── ToolConfig definitions ─────────────────────────────────────────────────

interface ConfigSeed {
  toolSlug: string;
  creditCost: number;
  isActive: boolean;
  aiModel: string;
  aiProvider: string;
  fallbackModel: string;
  fallbackProvider: string;
}

function cfg(
  toolSlug: string,
  creditCost: number,
  aiModel = "",
  aiProvider = "",
  fallbackModel = "",
  fallbackProvider = "",
): ConfigSeed {
  return {
    toolSlug,
    creditCost,
    isActive: true,
    aiModel,
    aiProvider,
    fallbackModel,
    fallbackProvider,
  };
}

const TOOL_CONFIGS: ConfigSeed[] = [
  // Free / no-AI tools
  cfg("hook-writer", 0, "gemini-flash-2.0", "google", "gpt-4o-mini", "openai"),
  cfg(
    "caption-generator",
    0,
    "gemini-flash-2.0",
    "google",
    "gpt-4o-mini",
    "openai",
  ),
  cfg("gst-invoice", 0),
  cfg("expense-tracker", 0),
  cfg("quotation-generator", 0),
  cfg("qr-generator", 0),
  cfg("salary-slip", 0),
  cfg("offer-letter", 0),
  cfg("gst-calculator", 0),
  cfg("tds-sheet", 0),

  // 1 credit
  cfg(
    "title-generator",
    1,
    "gemini-flash-2.0",
    "google",
    "gpt-4o-mini",
    "openai",
  ),
  cfg(
    "email-subject",
    1,
    "gemini-flash-2.0",
    "google",
    "gpt-4o-mini",
    "openai",
  ),
  cfg(
    "whatsapp-bulk",
    1,
    "gemini-flash-2.0",
    "google",
    "gpt-4o-mini",
    "openai",
  ),

  // 3 credits
  cfg(
    "blog-generator",
    3,
    "claude-haiku-3-5",
    "anthropic",
    "gpt-4o-mini",
    "openai",
  ),
  cfg(
    "resume-screener",
    3,
    "claude-haiku-3-5",
    "anthropic",
    "gpt-4o-mini",
    "openai",
  ),
  cfg("jd-generator", 3, "gpt-4o-mini", "openai", "gemini-flash-2.0", "google"),
  cfg(
    "appraisal-draft",
    3,
    "claude-haiku-3-5",
    "anthropic",
    "gpt-4o-mini",
    "openai",
  ),
  cfg(
    "policy-generator",
    3,
    "claude-haiku-3-5",
    "anthropic",
    "gpt-4o-mini",
    "openai",
  ),
  cfg("linkedin-bio", 3, "gpt-4o-mini", "openai", "gemini-flash-2.0", "google"),
  cfg("ad-copy", 3, "gpt-4o-mini", "openai", "gemini-flash-2.0", "google"),
  cfg(
    "legal-disclaimer",
    3,
    "gpt-4o-mini",
    "openai",
    "gemini-flash-2.0",
    "google",
  ),

  // 4 credits
  cfg("yt-script", 4, "claude-haiku-3-5", "anthropic", "gpt-4o-mini", "openai"),

  // 7 credits
  cfg("thumbnail-ai", 7, "dall-e-3", "openai", "", ""),

  // 8 credits
  cfg("seo-auditor", 8, "claude-sonnet-4-5", "anthropic", "gpt-4o", "openai"),

  // 10 credits
  cfg(
    "website-generator",
    10,
    "claude-sonnet-4-5",
    "anthropic",
    "gpt-4o",
    "openai",
  ),

  // 12 credits
  cfg("legal-notice", 12, "claude-sonnet-4-5", "anthropic", "gpt-4o", "openai"),
  cfg(
    "nda-generator",
    12,
    "claude-sonnet-4-5",
    "anthropic",
    "gpt-4o",
    "openai",
  ),
];

// ── CreditPack seed ─────────────────────────────────────────────────────────

const CREDIT_PACKS = [
  {
    name: "Try Pack",
    credits: 20,
    priceInr: 39,
    isFeatured: false,
    isActive: true,
    sortOrder: 1,
  },
  {
    name: "Starter",
    credits: 60,
    priceInr: 99,
    isFeatured: false,
    isActive: true,
    sortOrder: 2,
  },
  {
    name: "Popular",
    credits: 150,
    priceInr: 199,
    isFeatured: true,
    isActive: true,
    sortOrder: 3,
  },
  {
    name: "Pro",
    credits: 400,
    priceInr: 449,
    isFeatured: false,
    isActive: true,
    sortOrder: 4,
  },
  {
    name: "Enterprise",
    credits: 1200,
    priceInr: 999,
    isFeatured: false,
    isActive: true,
    sortOrder: 5,
  },
];

// ── SiteConfig seed ─────────────────────────────────────────────────────────

const SITE_CONFIGS = [
  { key: "default_theme", value: "dark" },
  { key: "maintenance_mode", value: false },
  { key: "announcement_banner", value: "" },
  { key: "announcement_visible", value: false },
];

// ── Main ────────────────────────────────────────────────────────────────────

async function seed() {
  console.log("🌱 Connecting to MongoDB…");
  await connectDB();
  console.log("✅ Connected\n");

  // Tools
  console.log("📦 Seeding Tools…");
  let toolsUpserted = 0;
  for (const tool of TOOLS) {
    await Tool.updateOne({ slug: tool.slug }, { $set: tool }, { upsert: true });
    toolsUpserted++;
  }
  console.log(`   ✅ ${toolsUpserted} tools upserted\n`);

  // ToolConfigs
  console.log("⚙️  Seeding ToolConfigs…");
  let configsUpserted = 0;
  for (const config of TOOL_CONFIGS) {
    await ToolConfig.updateOne(
      { toolSlug: config.toolSlug },
      { $set: config },
      { upsert: true },
    );
    configsUpserted++;
  }
  console.log(`   ✅ ${configsUpserted} tool configs upserted\n`);

  // CreditPacks
  console.log("💳 Seeding CreditPacks…");
  let packsUpserted = 0;
  for (const pack of CREDIT_PACKS) {
    await CreditPack.updateOne(
      { name: pack.name },
      { $set: pack },
      { upsert: true },
    );
    packsUpserted++;
  }
  console.log(`   ✅ ${packsUpserted} credit packs upserted\n`);

  // SiteConfig
  console.log("🔧 Seeding SiteConfig…");
  let configsSet = 0;
  for (const sc of SITE_CONFIGS) {
    await SiteConfig.updateOne({ key: sc.key }, { $set: sc }, { upsert: true });
    configsSet++;
  }
  console.log(`   ✅ ${configsSet} site configs upserted\n`);

  console.log("🎉 Seed complete!");
  await disconnectDB();
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
