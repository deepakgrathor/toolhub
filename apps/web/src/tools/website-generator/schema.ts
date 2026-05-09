import { z } from "zod";

export const websiteGeneratorSchema = z.object({
  businessName: z.string().min(2).max(100),
  businessType: z.string().min(3).max(100),
  description: z.string().min(20).max(500),
  targetAudience: z.string().min(5).max(200),
  keyServices: z.string().min(10).max(300),
  colorScheme: z.enum(["blue", "green", "purple", "red", "orange", "dark"]),
  style: z.enum(["modern", "minimal", "corporate", "creative"]),
  includeContact: z.boolean().default(true),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
});

export type WebsiteGeneratorInput = z.infer<typeof websiteGeneratorSchema>;
