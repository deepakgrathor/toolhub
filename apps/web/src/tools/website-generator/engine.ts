import { connectDB, CreditService, InsufficientCreditsError, ToolOutput, ToolConfig } from "@toolhub/db";
import type { ToolEngineContext, ToolEngineResult } from "@toolhub/shared";
import { callAI, extractJson } from "@/lib/ai";
import { applyWatermark } from "@/lib/watermark";
import { invalidateBalance } from "@/lib/credit-cache";
import { getSiteConfigValue } from "@/lib/site-config-cache";
import { sanitizeUserInput } from "@/lib/prompt-sanitizer";
import type { WebsiteGeneratorInput } from "./schema";

// ── Types ──────────────────────────────────────────────────────────────────

interface BusinessTheme {
  heroLayout: string;
  colorPersonality: string;
  typography: { heading: string; body: string };
  sectionEmphasis: string;
}

interface DesignBrief {
  colorSystem: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
    surface: string;
  };
  typography: { heading: string; body: string };
  heroContent: { headline: string; subheadline: string; ctaText: string };
  aboutContent: { heading: string; body: string };
  servicesContent: {
    heading: string;
    items: Array<{ title: string; description: string }>;
  };
  pageStructure: {
    page1: string[];
    page2?: string[];
    page3?: string[];
    page4?: string[];
  };
  pageNames: string[];
  generatedFaqs?: Array<{ question: string; answer: string }>;
  generatedTestimonials?: Array<{
    name: string;
    role: string;
    review: string;
    rating: number;
  }>;
  animationStyle: "none" | "fade" | "slide";
  copyTone: string;
  language: string;
}

// ── Business Theme Map ─────────────────────────────────────────────────────

interface BusinessThemeEntry {
  keywords: string[];
  theme: BusinessTheme;
}

const BUSINESS_THEME_ENTRIES: BusinessThemeEntry[] = [
  {
    keywords: ["restaurant", "cafe", "dhaba", "food"],
    theme: {
      heroLayout: "full-width-image",
      colorPersonality: "warm, appetizing, inviting",
      typography: { heading: "Playfair Display", body: "Lato" },
      sectionEmphasis: "gallery, testimonials, contact",
    },
  },
  {
    keywords: ["ca firm", "chartered", "accountant", "tax", "finance"],
    theme: {
      heroLayout: "split-left-text",
      colorPersonality: "trustworthy, professional, corporate",
      typography: { heading: "Merriweather", body: "Inter" },
      sectionEmphasis: "services, team, testimonials",
    },
  },
  {
    keywords: ["salon", "spa", "beauty", "parlour"],
    theme: {
      heroLayout: "centered-elegant",
      colorPersonality: "elegant, luxurious, self-care",
      typography: { heading: "Cormorant Garamond", body: "Raleway" },
      sectionEmphasis: "services, gallery, pricing",
    },
  },
  {
    keywords: ["gym", "fitness", "yoga", "wellness"],
    theme: {
      heroLayout: "full-width-dark",
      colorPersonality: "energetic, powerful, motivating",
      typography: { heading: "Oswald", body: "Open Sans" },
      sectionEmphasis: "services, pricing, testimonials",
    },
  },
  {
    keywords: ["real estate", "property", "builder", "construction"],
    theme: {
      heroLayout: "split-right-image",
      colorPersonality: "premium, trustworthy, aspirational",
      typography: { heading: "Libre Baskerville", body: "Source Sans Pro" },
      sectionEmphasis: "services, gallery, contact",
    },
  },
  {
    keywords: ["clinic", "hospital", "doctor", "medical", "dental"],
    theme: {
      heroLayout: "centered-clean",
      colorPersonality: "calm, trustworthy, caring",
      typography: { heading: "Nunito", body: "Open Sans" },
      sectionEmphasis: "services, team, faq",
    },
  },
  {
    keywords: ["tech", "startup", "software", "saas", "app"],
    theme: {
      heroLayout: "centered-gradient",
      colorPersonality: "innovative, modern, cutting-edge",
      typography: { heading: "Space Grotesk", body: "Inter" },
      sectionEmphasis: "services, pricing, faq",
    },
  },
  {
    keywords: ["school", "college", "institute", "education", "coaching"],
    theme: {
      heroLayout: "centered-modern",
      colorPersonality: "friendly, trustworthy, inspiring",
      typography: { heading: "Nunito", body: "Inter" },
      sectionEmphasis: "services, team, faq",
    },
  },
  {
    keywords: ["law", "legal", "advocate", "lawyer"],
    theme: {
      heroLayout: "split-left-text",
      colorPersonality: "authoritative, serious, trustworthy",
      typography: { heading: "Libre Baskerville", body: "Source Sans Pro" },
      sectionEmphasis: "services, team, testimonials",
    },
  },
];

const DEFAULT_THEME: BusinessTheme = {
  heroLayout: "centered-modern",
  colorPersonality: "professional, clean, trustworthy",
  typography: { heading: "Inter", body: "Inter" },
  sectionEmphasis: "services, about, contact",
};

function getBusinessTheme(businessType: string): BusinessTheme {
  const lower = businessType.toLowerCase();
  for (const entry of BUSINESS_THEME_ENTRIES) {
    if (entry.keywords.some((kw) => lower.includes(kw))) {
      return entry.theme;
    }
  }
  return DEFAULT_THEME;
}

// ── Credit Calculator ──────────────────────────────────────────────────────

function calculateDynamicCredits(
  input: WebsiteGeneratorInput,
  baseCost: number,
  siteConfig: Record<string, number>
): number {
  let total = baseCost;

  const p2 = siteConfig.website_page_2_credits ?? 15;
  const p3 = siteConfig.website_page_3_credits ?? 15;
  const p4 = siteConfig.website_page_4_credits ?? 15;

  if (input.pages === "2") total += p2;
  if (input.pages === "3") total += p2 + p3;
  if (input.pages === "4") total += p2 + p3 + p4;

  if (input.sections.testimonials) total += siteConfig.website_testimonials_credits ?? 3;
  if (input.sections.pricing)      total += siteConfig.website_pricing_credits ?? 3;
  if (input.sections.faq)          total += siteConfig.website_faq_credits ?? 3;
  if (input.sections.team)         total += siteConfig.website_team_credits ?? 3;
  if (input.sections.whatsapp)     total += siteConfig.website_whatsapp_credits ?? 2;
  if (input.sections.maps)         total += siteConfig.website_maps_credits ?? 2;
  if (input.sections.social)       total += siteConfig.website_social_credits ?? 1;
  if (input.animation)             total += siteConfig.website_animation_credits ?? 5;
  if (input.darkMode)              total += siteConfig.website_darkmode_credits ?? 5;

  return total;
}

// ── Fallback Design Brief ──────────────────────────────────────────────────

function buildFallbackBrief(input: WebsiteGeneratorInput, theme: BusinessTheme): DesignBrief {
  const pageCount = parseInt(input.pages, 10);
  const page1: string[] = ["hero", "about", "services"];
  if (input.sections.testimonials) page1.push("testimonials");
  if (input.sections.faq) page1.push("faq");
  if (input.includeContact) page1.push("contact");
  page1.push("footer");

  const pageStructure: DesignBrief["pageStructure"] = { page1 };
  const pageNames = ["Home"];

  if (pageCount >= 2) {
    pageStructure.page2 = ["hero", "services", ...(input.sections.pricing ? ["pricing"] : []), "footer"];
    pageNames.push("Services");
  }
  if (pageCount >= 3) {
    pageStructure.page3 = ["hero", ...(input.sections.team ? ["team"] : []), "about", "footer"];
    pageNames.push("About");
  }
  if (pageCount >= 4) {
    pageStructure.page4 = ["hero", "contact", ...(input.sections.maps ? ["maps"] : []), "footer"];
    pageNames.push("Contact");
  }

  const servicesList = input.keyServices
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .map((s) => ({ title: s, description: `Professional ${s} tailored for you.` }));

  return {
    colorSystem: {
      primary: "#7c3aed",
      secondary: "#6d28d9",
      accent: "#ede9fe",
      background: "#ffffff",
      text: "#1e293b",
      surface: "#f8fafc",
    },
    typography: theme.typography,
    heroContent: {
      headline: `Welcome to ${input.businessName}`,
      subheadline: input.description.slice(0, 120),
      ctaText: "Get Started",
    },
    aboutContent: {
      heading: `About ${input.businessName}`,
      body: input.description,
    },
    servicesContent: {
      heading: "Our Services",
      items: servicesList.length > 0 ? servicesList : [{ title: "Our Service", description: "Quality service tailored for you." }],
    },
    pageStructure,
    pageNames,
    animationStyle: input.animation ? "fade" : "none",
    copyTone: input.tone ?? "professional",
    language: input.language,
  };
}

// ── Stage 1: Haiku Design Brief Builder ───────────────────────────────────

async function buildDesignBrief(
  input: WebsiteGeneratorInput,
  theme: BusinessTheme
): Promise<DesignBrief> {
  const pageCount = parseInt(input.pages, 10);

  const enabledSections: string[] = [];
  if (input.sections.testimonials) enabledSections.push("testimonials");
  if (input.sections.pricing) enabledSections.push("pricing");
  if (input.sections.faq) enabledSections.push("faq");
  if (input.sections.team) enabledSections.push("team");
  if (input.sections.whatsapp) enabledSections.push("whatsapp");
  if (input.sections.maps) enabledSections.push("maps");
  if (input.sections.social) enabledSections.push("social");

  const manualParts: string[] = [];

  if (input.sections.team && input.sections.teamMembers && input.sections.teamMembers.length > 0) {
    const members = input.sections.teamMembers
      .map((m) => `- ${m.name} (${m.role})${m.bio ? ": " + m.bio : ""}`)
      .join("\n");
    manualParts.push(`Team Members:\n${members}`);
  }

  if (input.sections.pricing && input.sections.pricingPlans && input.sections.pricingPlans.length > 0) {
    const plans = input.sections.pricingPlans
      .map((p) => `- ${p.name}: ₹${p.price} | ${p.features.join(", ")}${p.highlighted ? " (Featured)" : ""}`)
      .join("\n");
    manualParts.push(`Pricing Plans:\n${plans}`);
  }

  if (input.sections.faq && input.sections.faqMode === "manual" && input.sections.faqList && input.sections.faqList.length > 0) {
    const faqs = input.sections.faqList
      .map((f) => `Q: ${f.question}\nA: ${f.answer}`)
      .join("\n");
    manualParts.push(`FAQ:\n${faqs}`);
  }

  if (input.sections.testimonials && input.sections.testimonialsMode === "manual" && input.sections.testimonialsList && input.sections.testimonialsList.length > 0) {
    const reviews = input.sections.testimonialsList
      .map((t) => `- "${t.review}" — ${t.name}, ${t.role} (${t.rating}/5)`)
      .join("\n");
    manualParts.push(`Testimonials:\n${reviews}`);
  }

  if (input.sections.whatsapp && input.sections.whatsappNumber) {
    const waText = input.sections.whatsappText ? ` | Message: ${input.sections.whatsappText}` : "";
    manualParts.push(`WhatsApp: ${input.sections.whatsappNumber}${waText}`);
  }

  if (input.sections.maps && input.sections.mapsQuery) {
    manualParts.push(`Google Maps Query: ${input.sections.mapsQuery}`);
  }

  if (input.sections.social && input.sections.socialLinks) {
    const links = Object.entries(input.sections.socialLinks)
      .filter(([, v]) => Boolean(v))
      .map(([k, v]) => `${k}: ${v}`)
      .join(", ");
    if (links) manualParts.push(`Social Links: ${links}`);
  }

  const manualDataSection = manualParts.length > 0
    ? "\n\nMANUAL DATA PROVIDED:\n" + manualParts.join("\n\n")
    : "";

  const p2Conditional = pageCount >= 2 ? `"page2": ["<section names for page 2>"],` : "";
  const p3Conditional = pageCount >= 3 ? `"page3": ["<section names for page 3>"],` : "";
  const p4Conditional = pageCount >= 4 ? `"page4": ["<section names for page 4>"],` : "";
  const faqConditional = (input.sections.faq && input.sections.faqMode !== "manual")
    ? `"generatedFaqs": [{"question": "<q>", "answer": "<a>"}],`
    : "";
  const testimonialConditional = (input.sections.testimonials && input.sections.testimonialsMode !== "manual")
    ? `"generatedTestimonials": [{"name": "<name>", "role": "<role>", "review": "<review>", "rating": 5}],`
    : "";

  const prompt = `You are an expert web designer and UX architect specializing in Indian business websites. Analyze the business details and return a precise design brief as valid JSON only. No explanation. No markdown. No preamble. Pure JSON only.

BUSINESS DETAILS:
- Business Name: ${input.businessName}
- Business Type: ${input.businessType}
- Description: ${input.description}
- Target Audience: ${input.targetAudience}
- Key Services: ${input.keyServices}
- Website Goal: ${input.websiteGoal ?? "showcase_work"}
- Tone: ${input.tone ?? "professional"}
- Color Scheme: ${input.colorScheme}
- Style: ${input.style}
- Language: ${input.language}
- Pages: ${input.pages}
- Animation Requested: ${input.animation}
- Dark Mode Requested: ${input.darkMode}

ENABLED SECTIONS: ${enabledSections.length > 0 ? enabledSections.join(", ") : "none (basic: hero, about, services, contact, footer)"}

BUSINESS THEME HINTS:
- Hero Layout: ${theme.heroLayout}
- Color Personality: ${theme.colorPersonality}
- Suggested Heading Font: ${theme.typography.heading}
- Suggested Body Font: ${theme.typography.body}
- Section Emphasis: ${theme.sectionEmphasis}
${manualDataSection}

Return ONLY this JSON structure (no markdown, no explanation):
{
  "colorSystem": {
    "primary": "<hex color>",
    "secondary": "<hex color>",
    "accent": "<hex color>",
    "background": "<hex color>",
    "text": "<hex color>",
    "surface": "<hex color>"
  },
  "typography": {
    "heading": "<Google Font name>",
    "body": "<Google Font name>"
  },
  "heroContent": {
    "headline": "<compelling headline for the business>",
    "subheadline": "<supporting text>",
    "ctaText": "<primary CTA button text>"
  },
  "aboutContent": {
    "heading": "<about section heading>",
    "body": "<2-3 sentences about the business>"
  },
  "servicesContent": {
    "heading": "<services section heading>",
    "items": [{"title": "<service name>", "description": "<1 sentence description>"}]
  },
  "pageStructure": {
    "page1": ["hero", "about", "services", "footer"],
    ${p2Conditional}
    ${p3Conditional}
    ${p4Conditional}
  },
  "pageNames": ["Home"],
  ${faqConditional}
  ${testimonialConditional}
  "animationStyle": "${input.animation ? "fade" : "none"}",
  "copyTone": "${input.tone ?? "professional"}",
  "language": "${input.language}"
}`;

  let rawResponse: string;
  try {
    rawResponse = await callAI(prompt, "claude-haiku-4-5", "anthropic", 1500);
  } catch (err) {
    console.error("[website-generator] Stage 1 Haiku failed:", err);
    return buildFallbackBrief(input, theme);
  }

  try {
    const parsed = extractJson(rawResponse) as Partial<DesignBrief>;
    return validateAndFillBrief(parsed, input, theme);
  } catch (err) {
    console.error("[website-generator] Stage 1 JSON parse failed:", err);
    return buildFallbackBrief(input, theme);
  }
}

function validateAndFillBrief(
  parsed: Partial<DesignBrief>,
  input: WebsiteGeneratorInput,
  theme: BusinessTheme
): DesignBrief {
  const fallback = buildFallbackBrief(input, theme);
  return {
    colorSystem: parsed.colorSystem ?? fallback.colorSystem,
    typography: parsed.typography ?? fallback.typography,
    heroContent: parsed.heroContent ?? fallback.heroContent,
    aboutContent: parsed.aboutContent ?? fallback.aboutContent,
    servicesContent: parsed.servicesContent ?? fallback.servicesContent,
    pageStructure: parsed.pageStructure ?? fallback.pageStructure,
    pageNames: parsed.pageNames ?? fallback.pageNames,
    generatedFaqs: parsed.generatedFaqs,
    generatedTestimonials: parsed.generatedTestimonials,
    animationStyle: parsed.animationStyle ?? fallback.animationStyle,
    copyTone: parsed.copyTone ?? fallback.copyTone,
    language: parsed.language ?? fallback.language,
  };
}

// ── Stage 2: Sonnet HTML Generator ─────────────────────────────────────────

async function generateWebsiteHTML(
  input: WebsiteGeneratorInput,
  brief: DesignBrief
): Promise<string> {
  const pageCount = parseInt(input.pages, 10);

  const logoInstruction = input.logoBase64
    ? `LOGO PROVIDED: Embed as <img src="data:image/png;base64,${input.logoBase64}" alt="${input.businessName} logo" style="height:40px;width:auto;object-fit:contain;"> in the header/navbar.`
    : `LOGO: None provided — use text-based logo (business name styled) in header.`;

  const contactBlock = input.includeContact
    ? `Phone: ${input.phone ?? ""}\nEmail: ${input.email ?? ""}`
    : "No contact section";

  const pageLines = [
    brief.pageStructure.page1 ? `Page 1 (${brief.pageNames[0] ?? "Home"}) sections: ${brief.pageStructure.page1.join(", ")}` : "",
    brief.pageStructure.page2 ? `Page 2 (${brief.pageNames[1] ?? "Services"}) sections: ${brief.pageStructure.page2.join(", ")}` : "",
    brief.pageStructure.page3 ? `Page 3 (${brief.pageNames[2] ?? "About"}) sections: ${brief.pageStructure.page3.join(", ")}` : "",
    brief.pageStructure.page4 ? `Page 4 (${brief.pageNames[3] ?? "Contact"}) sections: ${brief.pageStructure.page4.join(", ")}` : "",
  ].filter(Boolean).join("\n");

  const waBlock = (input.sections.whatsapp && input.sections.whatsappNumber)
    ? `WhatsApp Number: ${input.sections.whatsappNumber}\nWhatsApp Default Message: ${input.sections.whatsappText ?? "Hello! I found you on your website."}`
    : "";

  const mapsBlock = (input.sections.maps && input.sections.mapsQuery)
    ? `Google Maps query for iframe: ${input.sections.mapsQuery}`
    : "";

  const prompt = `You are an expert frontend developer specializing in beautiful, conversion-optimized business websites for Indian professionals. Generate complete, production-ready single-file HTML websites.

DESIGN BRIEF:
${JSON.stringify(brief, null, 2)}

${logoInstruction}

CONTACT INFO:
${contactBlock}
${waBlock ? "\n" + waBlock : ""}
${mapsBlock ? "\n" + mapsBlock : ""}

ABSOLUTE REQUIREMENTS — NEVER VIOLATE:
1. Return ONLY raw HTML starting with <!DOCTYPE html>
2. No markdown fences, no explanation, no preamble, no postamble
3. Complete HTML — never truncate, never summarize any section
4. Every selected section must be fully implemented with real content
5. Inline CSS only — no external stylesheets
6. Google Fonts: ONE @import at top of <style> tag is allowed
7. Use CSS custom properties (variables) for the color system
8. Mobile responsive — CSS Grid + Flexbox + media queries
9. Multi-page: all pages in one HTML file, JS tab switching (no page reload — JS shows/hides page divs)
10. Navigation: smooth, highlight active page
11. ${input.logoBase64 ? "Logo provided as base64: embed as <img> in header as instructed above" : "Use text-based logo (business name) in header"}
12. WhatsApp button: fixed bottom-right floating button if enabled (enabled=${input.sections.whatsapp})
13. Google Maps: <iframe> embed using the maps query if enabled (enabled=${input.sections.maps})
14. Dark mode: CSS class toggle on <body> if enabled (darkMode=${input.darkMode})
15. Animations: CSS keyframes + Intersection Observer if enabled (animation=${input.animation})
16. Indian Rupee ₹ symbol for any pricing
17. No placeholder lorem ipsum — all content must be relevant to the business
18. Footer must include: "Powered by SetuLix" in small subtle text
19. Page title: "${input.businessName} — ${input.businessType}"
20. Do NOT include any <script src="..."> external JS

PAGE STRUCTURE (${pageCount} page${pageCount > 1 ? "s" : ""}):
Navigation labels: ${brief.pageNames.join(", ")}
${pageLines}

Generate the complete HTML website now:`;

  return callAI(prompt, "claude-sonnet-4-5", "anthropic", 12000);
}

// ── HTML Cleaner ───────────────────────────────────────────────────────────

function cleanHtmlOutput(raw: string): string {
  let html = raw
    .replace(/^```(?:html)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();

  if (!html.toLowerCase().startsWith("<!doctype") && !html.toLowerCase().startsWith("<html")) {
    const match = html.match(/<!doctype[\s\S]*/i) ?? html.match(/<html[\s\S]*/i);
    if (match) {
      html = match[0];
    } else {
      throw new Error("AI response is not valid HTML — generation failed");
    }
  }

  return html;
}

// ── Main execute ───────────────────────────────────────────────────────────

export async function execute(
  input: WebsiteGeneratorInput,
  context: ToolEngineContext
): Promise<ToolEngineResult> {
  await connectDB();

  // 1. Fetch ToolConfig
  const toolConfigDoc = await ToolConfig.findOne({ toolSlug: context.toolSlug })
    .select("creditCost isActive aiModel aiProvider")
    .lean();

  if (toolConfigDoc?.isActive === false) {
    throw new Error("Tool is not available");
  }

  const baseCost = toolConfigDoc?.creditCost ?? 50;

  // 2. Fetch SiteConfig addon keys in parallel
  const [
    page2Credits,
    page3Credits,
    page4Credits,
    testimonialsCredits,
    pricingCredits,
    faqCredits,
    teamCredits,
    whatsappCredits,
    mapsCredits,
    socialCredits,
    animationCredits,
    darkmodeCredits,
  ] = await Promise.all([
    getSiteConfigValue("website_page_2_credits", 15),
    getSiteConfigValue("website_page_3_credits", 15),
    getSiteConfigValue("website_page_4_credits", 15),
    getSiteConfigValue("website_testimonials_credits", 3),
    getSiteConfigValue("website_pricing_credits", 3),
    getSiteConfigValue("website_faq_credits", 3),
    getSiteConfigValue("website_team_credits", 3),
    getSiteConfigValue("website_whatsapp_credits", 2),
    getSiteConfigValue("website_maps_credits", 2),
    getSiteConfigValue("website_social_credits", 1),
    getSiteConfigValue("website_animation_credits", 5),
    getSiteConfigValue("website_darkmode_credits", 5),
  ]);

  const siteConfig: Record<string, number> = {
    website_page_2_credits: Number(page2Credits),
    website_page_3_credits: Number(page3Credits),
    website_page_4_credits: Number(page4Credits),
    website_testimonials_credits: Number(testimonialsCredits),
    website_pricing_credits: Number(pricingCredits),
    website_faq_credits: Number(faqCredits),
    website_team_credits: Number(teamCredits),
    website_whatsapp_credits: Number(whatsappCredits),
    website_maps_credits: Number(mapsCredits),
    website_social_credits: Number(socialCredits),
    website_animation_credits: Number(animationCredits),
    website_darkmode_credits: Number(darkmodeCredits),
  };

  // 3. Calculate dynamic credit cost
  const dynamicCreditCost = calculateDynamicCredits(input, baseCost, siteConfig);

  // 4. Check balance
  const hasBalance = await CreditService.checkBalance(context.userId, dynamicCreditCost);
  if (!hasBalance) {
    const balance = await CreditService.getBalance(context.userId);
    throw new InsufficientCreditsError(balance, dynamicCreditCost);
  }

  // 5. Sanitize all user text inputs
  const sanitizedInput: WebsiteGeneratorInput = {
    ...input,
    businessName: sanitizeUserInput(input.businessName),
    businessType: sanitizeUserInput(input.businessType),
    description: sanitizeUserInput(input.description),
    targetAudience: sanitizeUserInput(input.targetAudience),
    keyServices: sanitizeUserInput(input.keyServices),
    sections: {
      ...input.sections,
      whatsappNumber: input.sections.whatsappNumber
        ? sanitizeUserInput(input.sections.whatsappNumber)
        : undefined,
      whatsappText: input.sections.whatsappText
        ? sanitizeUserInput(input.sections.whatsappText)
        : undefined,
      mapsQuery: input.sections.mapsQuery
        ? sanitizeUserInput(input.sections.mapsQuery)
        : undefined,
      teamMembers: input.sections.teamMembers?.map((m) => ({
        ...m,
        name: sanitizeUserInput(m.name),
        role: sanitizeUserInput(m.role),
        bio: m.bio ? sanitizeUserInput(m.bio) : undefined,
      })),
      faqList: input.sections.faqList?.map((f) => ({
        question: sanitizeUserInput(f.question),
        answer: sanitizeUserInput(f.answer),
      })),
      testimonialsList: input.sections.testimonialsList?.map((t) => ({
        ...t,
        name: sanitizeUserInput(t.name),
        role: sanitizeUserInput(t.role),
        review: sanitizeUserInput(t.review),
      })),
      pricingPlans: input.sections.pricingPlans?.map((p) => ({
        ...p,
        name: sanitizeUserInput(p.name),
        price: sanitizeUserInput(p.price),
        features: p.features.map((f) => sanitizeUserInput(f)),
      })),
    },
  };

  // 6. Get business theme from type
  const businessTheme = getBusinessTheme(sanitizedInput.businessType);

  // 7. Stage 1 — Build design brief (Haiku, max 1500 tokens)
  // If Stage 1 fails, buildDesignBrief returns a fallback — execution continues
  const designBrief = await buildDesignBrief(sanitizedInput, businessTheme);

  // 8. Stage 2 — Generate HTML (Sonnet, max 12000 tokens)
  // If Stage 2 throws, credits are NOT deducted (we haven't called deductCredits yet)
  const rawHtml = await generateWebsiteHTML(sanitizedInput, designBrief);

  // 9. Clean and validate HTML
  const htmlContent = cleanHtmlOutput(rawHtml);

  // 10. Apply watermark
  const finalHtml = applyWatermark(htmlContent, context.planSlug ?? "free", context.toolSlug);

  // 11. Extract metadata from HTML
  const titleMatch = finalHtml.match(/<title[^>]*>([^<]*)<\/title>/i);
  const pageTitle = titleMatch?.[1]?.trim() ?? input.businessName;

  const sectionIds: string[] = [];
  const idMatches = finalHtml.matchAll(/id=["']([^"']+)["']/gi);
  for (const m of idMatches) {
    const id = m[1].toLowerCase();
    if (
      ["hero", "about", "services", "contact", "features", "pricing", "testimonials", "team", "faq", "gallery", "footer"].includes(id)
    ) {
      sectionIds.push(m[1].charAt(0).toUpperCase() + m[1].slice(1));
    }
  }
  const sections = sectionIds.length > 0 ? [...new Set(sectionIds)] : ["Hero", "About", "Services"];
  const pages = parseInt(input.pages, 10);

  // 12. Deduct credits ONLY after both AI calls succeed and HTML is valid
  const { newBalance } = await CreditService.deductCredits(
    context.userId,
    dynamicCreditCost,
    context.toolSlug
  );
  await invalidateBalance(context.userId);

  // 13. Save ToolOutput
  await ToolOutput.create({
    userId: context.userId,
    toolSlug: context.toolSlug,
    inputSnapshot: input,
    outputText: finalHtml.slice(0, 500),
    creditsUsed: dynamicCreditCost,
  });

  const structured = { htmlContent: finalHtml, pageTitle, sections, pages };

  return {
    output: finalHtml,
    structured,
    creditsUsed: dynamicCreditCost,
    newBalance,
  };
}
