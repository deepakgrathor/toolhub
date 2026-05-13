import { connectDB, SiteConfig } from "@toolhub/db";

const KEY = "last_invoice_number";

export async function generateInvoiceNumber(): Promise<string> {
  await connectDB();

  const year = new Date().getFullYear();

  const result = await SiteConfig.findOneAndUpdate(
    { key: KEY },
    { $inc: { value: 1 } },
    { upsert: true, new: true }
  ).lean();

  const seq = result?.value as number ?? 1;
  const padded = String(seq).padStart(5, "0");

  return `SLX-${year}-${padded}`;
}
