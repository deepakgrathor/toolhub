import { Sparkles, Building2, Users, Scale, Megaphone } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface KitTool {
  slug: string;
  name: string;
}

export interface KitConfig {
  id: string;
  name: string;
  icon: LucideIcon;
  description: string;
  tools: KitTool[];
  pageSlug: string;
}

export const SIDEBAR_KITS: KitConfig[] = [
  {
    id: "creator",
    name: "Creator Kit",
    icon: Sparkles,
    description: "AI tools for content creators",
    pageSlug: "creator",
    tools: [
      { slug: "blog-generator", name: "Blog Generator" },
      { slug: "yt-script", name: "YT Script Writer" },
      { slug: "thumbnail-ai", name: "Thumbnail AI" },
      { slug: "title-generator", name: "Title Generator" },
      { slug: "hook-writer", name: "Hook Writer" },
      { slug: "caption-generator", name: "Caption Generator" },
    ],
  },
  {
    id: "sme",
    name: "SME Kit",
    icon: Building2,
    description: "Tools for small & medium businesses",
    pageSlug: "sme",
    tools: [
      { slug: "gst-invoice", name: "GST Invoice" },
      { slug: "expense-tracker", name: "Expense Tracker" },
      { slug: "quotation-generator", name: "Quotation Generator" },
      { slug: "website-generator", name: "Website Generator" },
      { slug: "qr-generator", name: "QR Generator" },
      { slug: "whatsapp-bulk", name: "WhatsApp Bulk" },
    ],
  },
  {
    id: "hr",
    name: "HR Kit",
    icon: Users,
    description: "HR & recruitment automation",
    pageSlug: "hr",
    tools: [
      { slug: "resume-screener", name: "Resume Screener" },
      { slug: "jd-generator", name: "JD Generator" },
      { slug: "offer-letter", name: "Offer Letter" },
      { slug: "appraisal-draft", name: "Appraisal Draft" },
      { slug: "policy-generator", name: "Policy Generator" },
      { slug: "salary-slip", name: "Salary Slip" },
    ],
  },
  {
    id: "ca-legal",
    name: "CA / Legal",
    icon: Scale,
    description: "Finance & legal document tools",
    pageSlug: "legal",
    tools: [
      { slug: "gst-calculator", name: "GST Calculator" },
      { slug: "tds-sheet", name: "TDS Sheet" },
      { slug: "legal-notice", name: "Legal Notice" },
      { slug: "nda-generator", name: "NDA Generator" },
      { slug: "legal-disclaimer", name: "Legal Disclaimer" },
    ],
  },
  {
    id: "marketing",
    name: "Marketing Kit",
    icon: Megaphone,
    description: "Marketing & growth tools",
    pageSlug: "marketing",
    tools: [
      { slug: "blog-generator", name: "Blog Generator" },
      { slug: "email-subject", name: "Email Subject" },
      { slug: "linkedin-bio", name: "LinkedIn Bio" },
      { slug: "whatsapp-bulk", name: "WhatsApp Bulk" },
      { slug: "seo-auditor", name: "SEO Auditor" },
      { slug: "ad-copy", name: "Ad Copy Writer" },
    ],
  },
];

/** Returns the kit id that first contains this slug, or null. */
export function getKitForSlug(slug: string): string | null {
  for (const kit of SIDEBAR_KITS) {
    if (kit.tools.some((t) => t.slug === slug)) return kit.id;
  }
  return null;
}
