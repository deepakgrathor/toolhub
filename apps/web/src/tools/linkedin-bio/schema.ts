import { z } from "zod";

export const linkedinBioSchema = z.object({
  name: z.string().min(2).max(100),
  currentRole: z.string().min(3).max(100),
  industry: z.string().min(2).max(100),
  topSkills: z.string().min(5).max(300),
  careerHighlight: z.string().max(300).optional(),
  yearsOfExperience: z.string().max(5).optional(),
});

export type LinkedinBioInput = z.infer<typeof linkedinBioSchema>;
