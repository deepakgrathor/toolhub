import { NextRequest, NextResponse } from "next/server";
import { connectDB, Plan, CreditPack } from "@toolhub/db";

const GST_RATE = 0.18;

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const type = searchParams.get("type");
  const slug = searchParams.get("slug");
  const id = searchParams.get("id");
  const cycle = (searchParams.get("cycle") ?? "monthly") as "monthly" | "yearly";

  if (!type || (type === "plan" && !slug) || (type === "pack" && !id)) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  await connectDB();

  if (type === "plan" && slug) {
    const plan = await Plan.findOne({ slug, isActive: true }).lean();
    if (!plan) return NextResponse.json({ error: "Plan not found" }, { status: 404 });

    const basePrice = cycle === "yearly"
      ? plan.pricing.yearly.basePrice
      : plan.pricing.monthly.basePrice;

    const subtotal = basePrice;
    const gstAmount = Math.round(subtotal * GST_RATE * 100) / 100;
    const total = subtotal + gstAmount;

    const credits = cycle === "yearly"
      ? plan.pricing.yearly.baseCredits
      : plan.pricing.monthly.baseCredits;

    return NextResponse.json({
      type: "plan",
      name: plan.name,
      credits,
      cycle,
      subtotal,
      gstAmount,
      total,
    });
  }

  if (type === "pack" && id) {
    const pack = await CreditPack.findById(id).lean();
    if (!pack) return NextResponse.json({ error: "Pack not found" }, { status: 404 });

    const subtotal = pack.price;
    const gstAmount = Math.round(subtotal * GST_RATE * 100) / 100;
    const total = subtotal + gstAmount;

    return NextResponse.json({
      type: "pack",
      name: pack.name,
      credits: pack.credits,
      cycle: null,
      subtotal,
      gstAmount,
      total,
    });
  }

  return NextResponse.json({ error: "Invalid type" }, { status: 400 });
}
