import type { Metadata } from "next";
import { connectDB, CreditPack } from "@toolhub/db";
import { PricingTable, type PackRow } from "@/components/admin/PricingTable";

export const metadata: Metadata = { title: "Admin Pricing — Toolspire" };
export const dynamic = "force-dynamic";

async function getPacks(): Promise<PackRow[]> {
  try {
    await connectDB();
    const packs = await CreditPack.find().sort({ sortOrder: 1 }).lean();
    return packs.map((p) => ({
      id: p._id.toString(),
      name: p.name,
      credits: p.credits,
      priceInr: p.priceInr,
      isFeatured: p.isFeatured,
      isActive: p.isActive,
      sortOrder: p.sortOrder,
      razorpayPlanId: p.razorpayPlanId,
    }));
  } catch {
    return [];
  }
}

export default async function AdminPricingPage() {
  const packs = await getPacks();

  return (
    <div className="p-6">
      <PricingTable initialPacks={packs} />
    </div>
  );
}
