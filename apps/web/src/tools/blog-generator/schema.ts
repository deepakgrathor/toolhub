import { z } from "zod";

export const blogGeneratorSchema = z.object({
  topic: z.string().min(3).max(200),
  tone: z.enum(["professional", "casual", "funny", "educational"]),
  length: z.enum(["short", "medium", "long"]),
  targetAudience: z.string().max(100).optional(),
  keywords: z.string().max(200).optional(),
});

export type BlogGeneratorInput = z.infer<typeof blogGeneratorSchema>;
