import { connectDB, CreditService, InsufficientCreditsError, ToolOutput, ToolConfig } from "@toolhub/db";
import type { ToolEngineContext, ToolEngineResult } from "@toolhub/shared";
import { callAI } from "@/lib/ai";
import { applyWatermark } from "@/lib/watermark";
import type { WebsiteGeneratorInput } from "./schema";

const COLOR_PALETTES: Record<string, string> = {
  blue: "primary:#2563eb, secondary:#1e40af, accent:#dbeafe, text:#1e293b",
  green: "primary:#16a34a, secondary:#15803d, accent:#dcfce7, text:#14532d",
  purple: "primary:#7c3aed, secondary:#6d28d9, accent:#ede9fe, text:#2e1065",
  red: "primary:#dc2626, secondary:#b91c1c, accent:#fee2e2, text:#7f1d1d",
  orange: "primary:#ea580c, secondary:#c2410c, accent:#ffedd5, text:#7c2d12",
  dark: "primary:#0f172a, secondary:#1e293b, accent:#334155, text:#f1f5f9",
};

function buildPrompt(input: WebsiteGeneratorInput): string {
  const palette = COLOR_PALETTES[input.colorScheme];
  const services = input.keyServices.split(",").map((s) => s.trim()).filter(Boolean);
  const contactSection = input.includeContact
    ? `Contact section with: ${input.phone ? "Phone: " + input.phone : ""} ${input.email ? "Email: " + input.email : ""}`
    : "No contact section needed";

  return `Generate a complete, professional single-page HTML website. Return ONLY the raw HTML, starting with <!DOCTYPE html>, no explanation, no markdown.

Business Details:
- Name: ${input.businessName}
- Type: ${input.businessType}
- Description: ${input.description}
- Target Audience: ${input.targetAudience}
- Key Services/Products: ${services.join(", ")}
- Design Style: ${input.style}
- Color Palette: ${palette}
- ${contactSection}

Requirements:
1. Complete HTML5 document with inline CSS only (no external stylesheets or CDN links)
2. Mobile responsive using CSS flexbox and media queries
3. Professional ${input.style} design matching the color palette
4. Sections: Hero, About, Services (show each service as a card), ${input.includeContact ? "Contact," : ""} Footer
5. Smooth hover effects, professional typography using system fonts
6. Indian rupee symbol (₹) if pricing is mentioned
7. All text must be relevant to the business type and description
8. Include a favicon meta tag
9. Page title: "${input.businessName} - ${input.businessType}"

Make it visually impressive, functional, and ready to deploy. Keep the code clean and under 250 lines.`;
}

export async function execute(
  input: WebsiteGeneratorInput,
  context: ToolEngineContext
): Promise<ToolEngineResult> {
  await connectDB();

  const toolConfigDoc = await ToolConfig.findOne({ toolSlug: context.toolSlug })
    .select("creditCost aiModel aiProvider")
    .lean();
  const creditCost = toolConfigDoc?.creditCost ?? 10;
  const aiModel = toolConfigDoc?.aiModel ?? "claude-sonnet-4-5";
  const aiProvider = toolConfigDoc?.aiProvider ?? "anthropic";

  const hasBalance = await CreditService.checkBalance(context.userId, creditCost);
  if (!hasBalance) {
    const balance = await CreditService.getBalance(context.userId);
    throw new InsufficientCreditsError(balance, creditCost);
  }

  const raw = await callAI(buildPrompt(input), aiModel, aiProvider, 8000);

  // Extract the HTML — clean markdown fences if present
  let htmlContent = raw
    .replace(/^```(?:html)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();

  // Ensure it starts with a valid HTML doctype
  if (!htmlContent.toLowerCase().startsWith("<!doctype") && !htmlContent.toLowerCase().startsWith("<html")) {
    const match = htmlContent.match(/<!doctype[\s\S]*/i) ?? htmlContent.match(/<html[\s\S]*/i);
    if (match) htmlContent = match[0];
  }

  const titleMatch = htmlContent.match(/<title[^>]*>([^<]*)<\/title>/i);
  const pageTitle = titleMatch?.[1]?.trim() ?? input.businessName;

  // Infer generated sections from HTML structure
  const sectionIds: string[] = [];
  const idMatches = htmlContent.matchAll(/id=["']([^"']+)["']/gi);
  for (const m of idMatches) {
    const id = m[1];
    if (["hero", "about", "services", "contact", "features", "pricing", "testimonials", "footer"].includes(id.toLowerCase())) {
      sectionIds.push(id.charAt(0).toUpperCase() + id.slice(1));
    }
  }
  const sections = sectionIds.length > 0 ? [...new Set(sectionIds)] : ["Hero", "About", "Services"];

  const finalHtml = applyWatermark(htmlContent, context.planSlug ?? "free", context.toolSlug);
  const parsed = { htmlContent: finalHtml, pageTitle, sections };

  const { newBalance } = await CreditService.deductCredits(
    context.userId,
    creditCost,
    context.toolSlug
  );

  await ToolOutput.create({
    userId: context.userId,
    toolSlug: context.toolSlug,
    inputSnapshot: input,
    outputText: finalHtml.slice(0, 500),
    creditsUsed: creditCost,
  });

  return { output: finalHtml, structured: parsed, creditsUsed: creditCost, newBalance };
}
