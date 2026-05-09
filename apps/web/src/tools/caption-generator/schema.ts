import { z } from "zod";

export const captionGeneratorSchema = z.object({
  topic: z.string().min(3).max(200),
  platform: z.enum(["instagram", "linkedin", "twitter", "facebook"]),
  tone: z.enum(["casual", "professional", "funny", "inspiring"]),
  includeHashtags: z.boolean().default(true),
});

export type CaptionGeneratorInput = z.infer<typeof captionGeneratorSchema>;
