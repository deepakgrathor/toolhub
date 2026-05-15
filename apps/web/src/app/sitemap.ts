import { MetadataRoute } from "next";

const TOOL_SLUGS = [
  "blog-generator", "yt-script", "thumbnail-ai",
  "title-generator", "hook-writer", "caption-generator",
  "gst-invoice", "expense-tracker", "quotation-generator",
  "salary-slip", "offer-letter", "tds-sheet", "qr-generator",
  "jd-generator", "resume-screener", "appraisal-draft",
  "policy-generator", "legal-notice", "nda-generator",
  "legal-disclaimer", "gst-calculator", "whatsapp-bulk",
  "ad-copy", "email-subject", "linkedin-bio",
  "seo-auditor", "website-generator",
];

const KIT_SLUGS = ["creator", "sme", "hr", "legal", "marketing"];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://setulix.com";
  const now = new Date();

  return [
    // Homepage
    { url: base, lastModified: now, changeFrequency: "daily", priority: 1.0 },

    // Kit pages
    ...KIT_SLUGS.map((slug) => ({
      url: `${base}/kits/${slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    })),

    // Individual tool pages
    ...TOOL_SLUGS.map((slug) => ({
      url: `${base}/tools/${slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.85,
    })),

    // Tools listing
    { url: `${base}/tools`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },

    // Pricing
    { url: `${base}/pricing`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },

    // About
    { url: `${base}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
  ];
}
