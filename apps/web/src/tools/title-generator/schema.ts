import { z } from "zod";

export const titleGeneratorSchema = z.object({
  topic: z.string().min(3, "Min 3 characters").max(200, "Max 200 characters"),
  platform: z.enum(["youtube", "blog", "linkedin", "twitter", "instagram"]),
  count: z.enum(["5", "10", "15"]),
  style: z.enum(["clickbait", "informative", "question", "howto", "listicle"]),
});

export type TitleGeneratorInput = z.infer<typeof titleGeneratorSchema>;
