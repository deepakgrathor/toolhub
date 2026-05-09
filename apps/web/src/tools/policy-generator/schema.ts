import { z } from "zod";

export const policyGeneratorSchema = z.object({
  companyName: z.string().min(2),
  policyType: z.enum([
    "leave-policy",
    "work-from-home",
    "code-of-conduct",
    "data-privacy",
    "expense-reimbursement",
    "anti-harassment",
    "social-media",
    "attendance",
  ]),
  companySize: z.enum(["startup", "small", "medium", "enterprise"]),
  industry: z.string().min(2).max(100),
  additionalPoints: z.string().max(500).optional(),
});

export type PolicyGeneratorInput = z.infer<typeof policyGeneratorSchema>;
