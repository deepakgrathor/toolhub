import { z } from "zod";

export const jdGeneratorSchema = z.object({
  jobTitle: z.string().min(3).max(100),
  department: z.string().min(2).max(100),
  experienceLevel: z.enum(["entry", "mid", "senior", "lead"]),
  workType: z.enum(["remote", "onsite", "hybrid"]),
  location: z.string().max(100).optional(),
  skills: z.string().min(5).max(300),
  companyContext: z.string().max(300).optional(),
});

export type JdGeneratorInput = z.infer<typeof jdGeneratorSchema>;
