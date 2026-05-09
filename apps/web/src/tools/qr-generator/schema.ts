import { z } from "zod";

export const qrGeneratorSchema = z.object({
  text: z.string().min(1).max(2000),
  size: z.enum(["128", "256", "512"]).default("256"),
  errorCorrection: z.enum(["L", "M", "Q", "H"]).default("M"),
});

export type QrGeneratorInput = z.infer<typeof qrGeneratorSchema>;
