import { z } from "zod";

export const legalNoticeSchema = z.object({
  senderName: z.string().min(2, "Min 2 characters"),
  senderAddress: z.string().min(10, "Min 10 characters"),
  receiverName: z.string().min(2, "Min 2 characters"),
  receiverAddress: z.string().min(10, "Min 10 characters"),
  noticeType: z.enum([
    "payment-recovery",
    "property-dispute",
    "service-deficiency",
    "cheque-bounce",
    "employment",
  ]),
  subject: z.string().min(10, "Min 10 characters").max(200, "Max 200 characters"),
  incidentDetails: z.string().min(50, "Min 50 characters").max(1000, "Max 1000 characters"),
  demand: z.string().min(10, "Min 10 characters").max(500, "Max 500 characters"),
  deadlineDays: z.enum(["7", "15", "30"]),
});

export type LegalNoticeInput = z.infer<typeof legalNoticeSchema>;
