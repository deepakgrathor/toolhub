import { z } from "zod";

export const hookWriterSchema = z.object({
  topic: z.string().min(3).max(200),
  platform: z.enum(["instagram", "youtube", "linkedin", "twitter"]),
  count: z.enum(["3", "5", "10"]).default("5"),
});

export type HookWriterInput = z.infer<typeof hookWriterSchema>;
