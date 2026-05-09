import { z } from "zod";

export const whatsappBulkSchema = z.object({
  businessType: z.string().min(3, "Min 3 characters").max(100, "Max 100 characters"),
  messageGoal: z.enum(["promotion", "reminder", "announcement", "followup", "greeting"]),
  offer: z.string().max(200, "Max 200 characters").optional(),
  includeEmoji: z.boolean().default(true),
});

export type WhatsappBulkInput = z.infer<typeof whatsappBulkSchema>;
