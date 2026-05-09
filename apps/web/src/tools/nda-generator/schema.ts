import { z } from "zod";

export const ndaGeneratorSchema = z.object({
  partyAName: z.string().min(2, "Min 2 characters"),
  partyAAddress: z.string().min(10, "Min 10 characters"),
  partyBName: z.string().min(2, "Min 2 characters"),
  partyBAddress: z.string().min(10, "Min 10 characters"),
  ndaType: z.enum(["one-way", "mutual"]),
  purpose: z.string().min(20, "Min 20 characters").max(500, "Max 500 characters"),
  durationMonths: z.enum(["6", "12", "24", "36"]),
  jurisdiction: z.string().min(2, "Min 2 characters"),
});

export type NdaGeneratorInput = z.infer<typeof ndaGeneratorSchema>;
