import type { Metadata } from "next";
import { connectDB, CreditPack } from "@toolhub/db";
import { PricingTable } from "@/components/admin/PricingTable";
import type { PackRow } from "@/components/admin/PricingTable";

export const metadata: Metadata = { title: "Admin Credit Packs — SetuLix" };
export const dynamic = "force-dynamic";

async function getPacks(): Promise<PackRow[]> {
  try {
    await connectDB();
    const packs = await CreditPack.find().sort({ order: 1 }).lean();
    return packs.map((p) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const raw = p as any;
      const price: number = p.price ?? raw.priceInr ?? 0;
      const credits: number = p.credits ?? 0;
      const pricePerCredit: number =
        p.pricePerCredit ?? (credits > 0 ? parseFloat((price / credits).toFixed(2)) : 0);
      return {
        id: p._id.toString(),
        name: p.name,
        credits,
        price,
        pricePerCredit,
        savingsPercent: (p.savingsPercent as number | undefined) ?? (raw.savingsPercent as number | undefined) ?? 0,
        tagline: (p.tagline as string | undefined) ?? (raw.tagline as string | undefined) ?? "",
        isPopular: p.isPopular ?? raw.isFeatured ?? false,
        isActive: p.isActive ?? true,
        order: p.order ?? raw.sortOrder ?? 0,
      };
    });
  } catch {
    return [];
  }
}

export default async function AdminCreditPacksPage() {
  const packs = await getPacks();
  return (
    <div className="p-6">
      <PricingTable initialPacks={packs} />
    </div>
  );
}
