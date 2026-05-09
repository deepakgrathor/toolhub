import { z } from "zod";

export const legalDisclaimerSchema = z.object({
  businessType: z.string().min(3, "Min 3 characters").max(100, "Max 100 characters"),
  websiteUrl: z.string().max(200).optional(),
  disclaimerType: z.enum([
    "general-website",
    "medical-health",
    "financial-investment",
    "affiliate-marketing",
    "ai-generated-content",
  ]),
  additionalInfo: z.string().max(300, "Max 300 characters").optional(),
});

export type LegalDisclaimerInput = z.infer<typeof legalDisclaimerSchema>;
