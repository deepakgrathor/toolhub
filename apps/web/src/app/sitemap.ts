import type { MetadataRoute } from "next";
import { SIDEBAR_KITS } from "@/lib/kit-config";

const BASE = "https://setulix.com";

const STATIC_ROUTES: MetadataRoute.Sitemap = [
  { url: BASE, changeFrequency: "weekly", priority: 1.0 },
  { url: `${BASE}/pricing`, changeFrequency: "weekly", priority: 0.9 },
  { url: `${BASE}/about`, changeFrequency: "monthly", priority: 0.7 },
  { url: `${BASE}/kits/creator`, changeFrequency: "monthly", priority: 0.8 },
  { url: `${BASE}/kits/sme`, changeFrequency: "monthly", priority: 0.8 },
  { url: `${BASE}/kits/hr`, changeFrequency: "monthly", priority: 0.8 },
  { url: `${BASE}/kits/legal`, changeFrequency: "monthly", priority: 0.8 },
  { url: `${BASE}/kits/marketing`, changeFrequency: "monthly", priority: 0.8 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  // Deduplicate slugs (some tools appear in multiple kits)
  const slugSet = new Set<string>();
  for (const kit of SIDEBAR_KITS) {
    for (const tool of kit.tools) {
      slugSet.add(tool.slug);
    }
  }

  const toolRoutes: MetadataRoute.Sitemap = Array.from(slugSet).map((slug) => ({
    url: `${BASE}/tools/${slug}`,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [...STATIC_ROUTES, ...toolRoutes];
}
