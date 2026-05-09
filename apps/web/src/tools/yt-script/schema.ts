import { z } from "zod";

export const ytScriptSchema = z.object({
  videoTitle: z.string().min(5).max(200),
  duration: z.enum(["5", "10", "15", "20"]),
  style: z.enum(["educational", "entertaining", "documentary", "tutorial"]),
  targetAudience: z.string().max(100).optional(),
  keywords: z.string().max(200).optional(),
});

export type YtScriptInput = z.infer<typeof ytScriptSchema>;
