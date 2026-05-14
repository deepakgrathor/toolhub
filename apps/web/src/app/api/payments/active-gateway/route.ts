import { NextResponse } from "next/server";
import { connectDB, PaymentGateway } from "@toolhub/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectDB();

    const gateway = await PaymentGateway.findOne({ isDefault: true, isActive: true })
      .select("slug supports name")
      .lean();

    if (!gateway) {
      return NextResponse.json({ gatewaySlug: "cashfree", supports: {} });
    }

    return NextResponse.json({
      gatewaySlug: gateway.slug,
      supports: gateway.supports,
      name: gateway.name,
    });
  } catch {
    return NextResponse.json({ gatewaySlug: "cashfree", supports: {} });
  }
}
