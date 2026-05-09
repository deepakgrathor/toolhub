import { z } from "zod";

export const adCopySchema = z.object({
  productName: z.string().min(2, "Min 2 characters").max(100, "Max 100 characters"),
  productDescription: z.string().min(20, "Min 20 characters").max(500, "Max 500 characters"),
  targetAudience: z.string().min(5, "Min 5 characters").max(200, "Max 200 characters"),
  platform: z.enum(["facebook", "instagram", "google", "linkedin", "twitter"]),
  goal: z.enum(["awareness", "leads", "sales", "traffic", "engagement"]),
  usp: z.string().min(5, "Min 5 characters").max(200, "Max 200 characters"),
});

export type AdCopyInput = z.infer<typeof adCopySchema>;
