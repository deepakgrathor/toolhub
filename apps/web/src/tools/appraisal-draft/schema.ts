import { z } from "zod";

export const appraisalDraftSchema = z.object({
  employeeName: z.string().min(2),
  role: z.string().min(2),
  reviewPeriod: z.string().min(1),
  achievements: z.string().min(20).max(1000),
  areasOfImprovement: z.string().min(10).max(500),
  rating: z.enum(["exceptional", "exceeds", "meets", "below", "unsatisfactory"]),
  managerName: z.string().min(2),
  tone: z.enum(["formal", "encouraging", "constructive"]),
});

export type AppraisalDraftInput = z.infer<typeof appraisalDraftSchema>;
