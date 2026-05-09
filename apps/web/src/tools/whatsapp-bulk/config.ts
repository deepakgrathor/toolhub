export const whatsappBulkConfig = {
  slug: "whatsapp-bulk",
  name: "WhatsApp Bulk Message",
  description: "Draft personalised bulk WhatsApp messages for your customer list using AI.",
  creditCost: 1,
  kits: ["sme", "marketing"],
  isAI: true,
  model: "gemini-flash-2.0",
  provider: "google",
} as const;
