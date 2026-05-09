import { z } from "zod";

export const resumeScreenerSchema = z.object({
  resumeText: z
    .string()
    .min(100, "Resume too short — paste full resume text")
    .max(5000, "Resume too long — max 5000 characters"),
  jobDescription: z
    .string()
    .min(50, "JD too short — provide more detail")
    .max(3000, "JD too long — max 3000 characters"),
});

export type ResumeScreenerInput = z.infer<typeof resumeScreenerSchema>;
