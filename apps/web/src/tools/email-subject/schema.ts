import { z } from "zod";

export const emailSubjectSchema = z.object({
  emailGoal: z.string().min(10, "Min 10 characters").max(300, "Max 300 characters"),
  tone: z.enum(["professional", "casual", "urgent", "friendly", "promotional"]),
  count: z.enum(["5", "10"]),
});

export type EmailSubjectInput = z.infer<typeof emailSubjectSchema>;
