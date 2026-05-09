import { z } from "zod";

export const seoAuditorSchema = z.object({
  websiteUrl: z.string().url(),
  businessType: z.string().min(3).max(100),
  targetKeywords: z.string().min(3).max(300),
  competitors: z.string().max(300).optional(),
});

export type SeoAuditorInput = z.infer<typeof seoAuditorSchema>;
