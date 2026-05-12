import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  Sparkles, Building2, Users, Scale, Megaphone, ChevronDown,
} from "lucide-react";
import { getToolIcon } from "@/lib/tool-icons";
import KitCTAButtons from "./KitCTAButtons";

interface KitData {
  name: string;
  tagline: string;
  Icon: React.ElementType;
  tools: { slug: string; name: string; description: string; creditCost: number; isFree: boolean }[];
  steps: { title: string; description: string }[];
  useCases: { title: string; description: string }[];
  faqs: { q: string; a: string }[];
}

const KITS: Record<string, KitData> = {
  creator: {
    name: "Creator Kit",
    tagline: "6 AI tools for Indian content creators",
    Icon: Sparkles,
    tools: [
      { slug: "blog-generator",    name: "Blog Generator",    description: "Generate SEO-optimized blog posts in seconds.", creditCost: 3, isFree: false },
      { slug: "yt-script",         name: "YT Script Writer",  description: "Write viral YouTube scripts with hooks and CTAs.", creditCost: 3, isFree: false },
      { slug: "thumbnail-ai",      name: "Thumbnail AI",      description: "Generate eye-catching thumbnail concepts.", creditCost: 5, isFree: false },
      { slug: "title-generator",   name: "Title Generator",   description: "Click-worthy titles for blogs, videos, and posts.", creditCost: 1, isFree: false },
      { slug: "hook-writer",       name: "Hook Writer",       description: "Powerful opening hooks that grab attention.", creditCost: 1, isFree: false },
      { slug: "caption-generator", name: "Caption Generator", description: "Catchy captions for Instagram, LinkedIn, and more.", creditCost: 1, isFree: false },
    ],
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
    Icon: Building2,
    tools: [
      { slug: "gst-invoice",         name: "GST Invoice",         description: "Professional GST-compliant invoices in seconds.", creditCost: 2, isFree: false },
      { slug: "expense-tracker",     name: "Expense Tracker",     description: "Smart expense summaries and reports.", creditCost: 1, isFree: false },
      { slug: "quotation-generator", name: "Quotation Generator", description: "Professional quotations for your clients.", creditCost: 2, isFree: false },
      { slug: "website-generator",   name: "Website Generator",   description: "AI-generated website copy for your business.", creditCost: 4, isFree: false },
      { slug: "qr-generator",        name: "QR Generator",        description: "Custom QR codes for payments, menus, and more.", creditCost: 0, isFree: true },
      { slug: "gst-calculator",      name: "GST Calculator",      description: "Quick and accurate GST calculations.", creditCost: 0, isFree: true },
    ],
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
      { q: "Is GST Invoice free?", a: "GST Invoice uses 2 credits per generation. 100 credits = ₹99." },
      { q: "Is QR Generator really free?", a: "Yes! QR Generator and GST Calculator are completely free forever." },
      { q: "Do credits expire?", a: "No, your credits never expire." },
    ],
  },
  hr: {
    name: "HR Kit",
    tagline: "HR automation tools for Indian professionals",
    Icon: Users,
    tools: [
      { slug: "jd-generator",      name: "JD Generator",      description: "Job descriptions in minutes for any role.", creditCost: 2, isFree: false },
      { slug: "resume-screener",   name: "Resume Screener",   description: "AI-powered resume shortlisting.", creditCost: 3, isFree: false },
      { slug: "appraisal-draft",   name: "Appraisal Draft",   description: "Performance appraisal documents instantly.", creditCost: 2, isFree: false },
      { slug: "policy-generator",  name: "Policy Generator",  description: "HR policy documents for your organization.", creditCost: 2, isFree: false },
      { slug: "offer-letter",      name: "Offer Letter",      description: "Professional offer letters in seconds.", creditCost: 2, isFree: false },
      { slug: "salary-slip",       name: "Salary Slip",       description: "Salary slips for any employee in seconds.", creditCost: 1, isFree: false },
    ],
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
    Icon: Scale,
    tools: [
      { slug: "legal-notice",    name: "Legal Notice",    description: "Draft legal notices fast for any situation.", creditCost: 3, isFree: false },
      { slug: "nda-generator",   name: "NDA Generator",   description: "Non-disclosure agreements in minutes.", creditCost: 3, isFree: false },
      { slug: "legal-disclaimer",name: "Legal Disclaimer",description: "Website and app legal disclaimers.", creditCost: 2, isFree: false },
      { slug: "gst-calculator",  name: "GST Calculator",  description: "Quick and accurate GST calculations.", creditCost: 0, isFree: true },
      { slug: "tds-sheet",       name: "TDS Sheet",       description: "TDS calculations and sheets.", creditCost: 1, isFree: false },
      { slug: "whatsapp-bulk",   name: "WhatsApp Bulk",   description: "Professional bulk message templates.", creditCost: 1, isFree: false },
    ],
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
    Icon: Megaphone,
    tools: [
      { slug: "ad-copy",         name: "Ad Copy",         description: "High-converting ad copy for Facebook, Google, and more.", creditCost: 2, isFree: false },
      { slug: "caption-generator",name:"Caption Generator",description: "Engaging captions for social media.", creditCost: 1, isFree: false },
      { slug: "email-subject",   name: "Email Subject",   description: "High open-rate email subject lines.", creditCost: 1, isFree: false },
      { slug: "linkedin-bio",    name: "LinkedIn Bio",    description: "Professional LinkedIn bios that convert.", creditCost: 2, isFree: false },
      { slug: "hook-writer",     name: "Hook Writer",     description: "Attention-grabbing hooks for all content.", creditCost: 1, isFree: false },
      { slug: "seo-auditor",     name: "SEO Auditor",     description: "Quick SEO content audit and suggestions.", creditCost: 3, isFree: false },
    ],
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

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const kit = KITS[params.slug];
  if (!kit) return {};
  return {
    title: `${kit.name} — AI Tools for Indian Professionals | SetuLix`,
    description: kit.tagline,
  };
}

export default function MarketingKitPage({ params }: { params: { slug: string } }) {
  const kit = KITS[params.slug];
  if (!kit) notFound();

  const { name, tagline, Icon, tools, steps, useCases, faqs } = kit;

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
                        <span className="shrink-0 rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold text-primary">{tool.creditCost}cr</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{tool.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

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
