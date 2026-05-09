import { z } from "zod";

export const gstCalculatorSchema = z.object({
  amount: z.coerce.number().positive().max(10_00_00_000),
  rate: z.enum(["5", "12", "18", "28"]),
  type: z.enum(["exclusive", "inclusive"]),
  transactionType: z.enum(["intrastate", "interstate"]),
});

export type GstCalculatorInput = z.infer<typeof gstCalculatorSchema>;
