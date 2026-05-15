import { MetadataRoute } from "next";
import { toolSeoData } from "@/data/tool-seo";

const KIT_SLUGS = ["creator", "sme", "hr", "legal", "marketing"];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://setulix.com";
  const now = new Date();

  // Tool slugs sourced from toolSeoData (single source of truth for all 27 tools)
  const toolSlugs = toolSeoData.map((t) => t.slug);

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
    ...toolSlugs.map((slug) => ({
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
