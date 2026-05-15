import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  Sparkles, Building2, Users, Scale, Megaphone, ChevronDown,
} from "lucide-react";
import { getToolIcon } from "@/lib/tool-icons";
import KitCTAButtons from "./KitCTAButtons";
import { getToolsByKit } from "@/lib/tool-registry";

export const revalidate = 3600;

export async function generateStaticParams() {
  return [
    { slug: 'creator' },
    { slug: 'sme' },
    { slug: 'hr' },
    { slug: 'legal' },
    { slug: 'marketing' },
  ];
}

// ── Kit icon map (URL slug → lucide component) ───────────────────────────────
const KIT_ICONS: Record<string, React.ElementType> = {
  creator: Sparkles,
  sme: Building2,
  hr: Users,
  legal: Scale,
  marketing: Megaphone,
};

// ── URL slug → DB kit slug (when they differ) ────────────────────────────────
const KIT_DB_SLUG: Record<string, string> = {
  legal: "ca-legal",
};

// ── Static marketing copy — NO credit costs ───────────────────────────────────
interface MarketingContent {
  name: string;
  tagline: string;
  steps: { title: string; description: string }[];
  useCases: { title: string; description: string }[];
  faqs: { q: string; a: string }[];
}

const MARKETING_CONTENT: Record<string, MarketingContent> = {
  creator: {
    name: "Creator Kit",
    tagline: "6 AI tools for Indian content creators",
    steps: [
      { title: "Choose a Tool", description: "Pick from 6 AI creator tools based on what you need to create today." },
      { title: "Enter Your Details", description: "Provide your topic, niche, or keywords. The AI handles the rest." },
      { title: "Generate & Export", description: "Get your content in seconds. Copy, download, or refine as needed." },
    ],
    useCases: [
      { title: "YouTube Creators", description: "Scripts for finance, tech, education, and entertainment channels in Hindi and English." },
      { title: "Instagram Influencers", description: "Captions, hooks, and content ideas that drive engagement." },
      { title: "Bloggers & Writers", description: "Long-form SEO blogs for Indian topics and audiences in minutes." },
      { title: "Marketing Agencies", description: "Produce content at scale for multiple clients without more writers." },
    ],
    faqs: [
      { q: "Are these tools free?", a: "Some tools have a free preview. Full generation requires credits starting at ₹99 for 100 credits." },
      { q: "Can I generate in Hindi?", a: "Yes! Specify Hindi in your prompt and the AI will generate in Hindi, Hinglish, or any Indian language." },
      { q: "Do credits expire?", a: "No, your credits never expire. Buy once, use whenever you need." },
    ],
  },
  sme: {
    name: "SME Kit",
    tagline: "Business tools for Indian small & medium enterprises",
    steps: [
      { title: "Select Your Tool", description: "Choose from invoicing, quotation, or calculation tools." },
      { title: "Enter Business Details", description: "Fill in your business info once. Reuse for every document." },
      { title: "Download & Share", description: "Get professional PDFs instantly. Send to clients." },
    ],
    useCases: [
      { title: "Retail & Trading", description: "Create GST invoices and quotations for B2B and B2C customers." },
      { title: "Freelancers", description: "Professional invoices and quotations to impress clients." },
      { title: "Restaurants & Cafes", description: "QR menus, payment QR codes, and expense tracking." },
      { title: "Service Businesses", description: "Website copy and professional business documentation." },
    ],
    faqs: [
      { q: "Is QR Generator really free?", a: "Yes! QR Generator and GST Calculator are completely free forever." },
      { q: "Can I save my business details?", a: "Yes, save your business profile once and reuse it for every document." },
      { q: "Do credits expire?", a: "No, your credits never expire." },
    ],
  },
  hr: {
    name: "HR Kit",
    tagline: "HR automation tools for Indian professionals",
    steps: [
      { title: "Choose HR Task", description: "Pick from 6 HR tools for recruitment or documentation." },
      { title: "Enter Details", description: "Fill in employee, role, or policy details." },
      { title: "Download & Send", description: "Get professional documents instantly." },
    ],
    useCases: [
      { title: "Recruitment Teams", description: "Write JDs and screen resumes 10x faster." },
      { title: "HR Managers", description: "Policy documents, offer letters, and appraisals in minutes." },
      { title: "Startups", description: "Professional HR documentation without an HR department." },
      { title: "Payroll Teams", description: "Salary slips for entire teams in one click." },
    ],
    faqs: [
      { q: "How accurate is Resume Screener?", a: "Our AI analyzes skills, experience, and role fit. Always review AI output before decisions." },
      { q: "Can I customize offer letters?", a: "Yes, enter your company details and customize before downloading." },
      { q: "Do credits expire?", a: "No, your credits never expire." },
    ],
  },
  legal: {
    name: "CA / Legal Kit",
    tagline: "Legal and finance tools for Indian CA and legal professionals",
    steps: [
      { title: "Select Document Type", description: "Choose from notices, NDAs, disclaimers, or calculation tools." },
      { title: "Enter Case Details", description: "Fill in party details, dates, and relevant information." },
      { title: "Generate & Review", description: "AI drafts the document. Review, edit, and download." },
    ],
    useCases: [
      { title: "Practicing CAs", description: "GST calculations, TDS sheets, and client communications." },
      { title: "Law Firms", description: "Draft legal notices and NDAs for clients faster." },
      { title: "Startups & Businesses", description: "Legal disclaimers, NDAs for vendors, and contracts." },
      { title: "Consultants", description: "Client agreements and professional communications." },
    ],
    faqs: [
      { q: "Are legal documents legally valid?", a: "AI-generated drafts are starting points. Always have a qualified lawyer review before use." },
      { q: "Is GST Calculator free?", a: "Yes, GST Calculator is completely free forever." },
      { q: "Do credits expire?", a: "No, your credits never expire." },
    ],
  },
  marketing: {
    name: "Marketing Kit",
    tagline: "Marketing and growth tools for Indian marketers",
    steps: [
      { title: "Pick Marketing Tool", description: "Choose from 6 tools covering ads, social, email, and SEO." },
      { title: "Enter Your Context", description: "Describe your product, audience, and goal." },
      { title: "Get Copy & Launch", description: "AI writes high-converting copy. Edit and publish." },
    ],
    useCases: [
      { title: "Digital Marketers", description: "Ad copy, email subjects, and social captions at scale." },
      { title: "Founders & Entrepreneurs", description: "LinkedIn presence, product positioning, and growth copy." },
      { title: "Content Creators", description: "SEO-optimized content and viral hooks." },
      { title: "E-commerce Businesses", description: "Product descriptions, ad copy, and email campaigns." },
    ],
    faqs: [
      { q: "What platforms does ad copy work for?", a: "Facebook, Instagram, Google, LinkedIn, and more. Specify platform in your prompt." },
      { q: "Can I generate in Hindi?", a: "Yes! Specify Hindi or Hinglish in your prompt." },
      { q: "Do credits expire?", a: "No, your credits never expire." },
    ],
  },
};

// ── Metadata ─────────────────────────────────────────────────────────────────

const KIT_DESCRIPTIONS: Record<string, string> = {
  creator:
    "6 AI-powered tools for Indian content creators and YouTubers. Generate blog posts, YouTube scripts, thumbnails, titles, hooks and captions — all from one platform.",
  sme:
    "7 free business tools built for Indian SMEs and freelancers. Create GST invoices, salary slips, quotations, offer letters and TDS sheets — zero credits required.",
  hr:
    "4 AI-powered HR tools for Indian teams and HR professionals. Generate job descriptions, screen resumes, draft appraisals and create HR policies in minutes.",
  legal:
    "5 AI legal tools for Indian businesses and CA professionals. Draft legal notices, NDAs, disclaimers and calculate GST — all compliant with Indian law.",
  marketing:
    "5 AI marketing tools for Indian brands and agencies. Write ad copy, email subject lines, LinkedIn bios and get full SEO audits — powered by GPT-4o and Gemini.",
};

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const { slug } = params;

  const description = KIT_DESCRIPTIONS[slug];
  if (!description) {
    return { title: "Kit not found | SetuLix" };
  }

  const kitName = slug.charAt(0).toUpperCase() + slug.slice(1);
  const title = `${kitName} Kit — AI Tools for Indian Professionals`;

  return {
    title,
    description,
    alternates: {
      canonical: `https://setulix.com/kits/${slug}`,
    },
    openGraph: {
      title: `${title} | SetuLix`,
      description,
      url: `https://setulix.com/kits/${slug}`,
      images: [{ url: "/og-default.png", width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | SetuLix`,
      description,
      images: ["/og-default.png"],
    },
  };
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function MarketingKitPage({ params }: { params: { slug: string } }) {
  const content = MARKETING_CONTENT[params.slug];
  if (!content) notFound();

  const dbSlug = KIT_DB_SLUG[params.slug] ?? params.slug;
  // Graceful fallback: DB may be unavailable at build time (ISR — DB is hit at runtime)
  const tools = await getToolsByKit(dbSlug).catch(() => [] as Awaited<ReturnType<typeof getToolsByKit>>);

  const { name, tagline, steps, useCases, faqs } = content;
  const Icon = KIT_ICONS[params.slug] ?? Sparkles;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="border-b border-border py-16 px-6 text-center">
        <div className="flex justify-center mb-5">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
            <Icon className="h-10 w-10 text-primary" />
          </div>
        </div>
        <h1 className="text-4xl font-bold text-foreground mb-3">{name}</h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-8">{tagline}</p>
        <KitCTAButtons />
      </section>

      <div className="max-w-5xl mx-auto px-6 py-16 space-y-20">
        {/* Tools Grid */}
        {tools.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-2 border-l-2 border-primary pl-3">
              Tools in this Kit
            </h2>
            <p className="text-sm text-muted-foreground mb-6 pl-5">{tools.length} tools available</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {tools.map((tool) => {
                const ToolIcon = getToolIcon(tool.slug);
                return (
                  <div
                    key={tool.slug}
                    className="flex items-start gap-3 rounded-xl border border-border bg-card p-4"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                      <ToolIcon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-medium text-foreground truncate">{tool.name}</span>
                        {tool.isFree ? (
                          <span className="shrink-0 rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-600">FREE</span>
                        ) : (
                          <span className="shrink-0 rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold text-primary">AI</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">{tool.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* How it Works */}
        <section>
          <h2 className="text-2xl font-bold text-foreground mb-8 border-l-2 border-primary pl-3">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {steps.map((step, i) => (
              <div key={i}>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm mb-4">
                  {i + 1}
                </div>
                <h3 className="font-semibold text-foreground mb-1">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Use Cases */}
        <section>
          <h2 className="text-2xl font-bold text-foreground mb-6 border-l-2 border-primary pl-3">Use Cases</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {useCases.map((uc, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-5">
                <h3 className="font-semibold text-foreground mb-1">{uc.title}</h3>
                <p className="text-sm text-muted-foreground">{uc.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section>
          <h2 className="text-2xl font-bold text-foreground mb-6 border-l-2 border-primary pl-3">FAQ</h2>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <details key={i} className="group rounded-xl border border-border bg-card overflow-hidden">
                <summary className="flex cursor-pointer items-center justify-between px-5 py-4 font-medium text-foreground select-none list-none hover:bg-muted/40 transition-colors">
                  {faq.q}
                  <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180 shrink-0" />
                </summary>
                <p className="px-5 pb-4 text-sm text-muted-foreground">{faq.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="rounded-2xl border border-border bg-card p-10 text-center">
          <h2 className="text-xl font-bold text-foreground mb-2">Start Using These Tools Today</h2>
          <p className="text-sm text-muted-foreground mb-6">Free to start, no credit card required.</p>
          <KitCTAButtons />
        </section>
      </div>
    </div>
  );
}
