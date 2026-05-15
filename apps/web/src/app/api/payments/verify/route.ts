import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB, Payment, PaymentGateway } from "@toolhub/db";
import { buildGatewayFromDoc } from "@/lib/gateways/manager";
import { processCreditPackPayment, processPlanPayment } from "@/lib/payment-processor";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orderId = req.nextUrl.searchParams.get("order_id");
    if (!orderId) {
      return NextResponse.json({ error: "order_id required" }, { status: 400 });
    }

    await connectDB();

    // Security: ensure payment belongs to this user
    const existing = await Payment.findOne({ orderId, userId: session.user.id });

    if (!existing) {
      return NextResponse.json({ status: "not_found" });
    }

    if (existing.status === "paid") {
      return NextResponse.json({ status: "paid", type: existing.type, credits: existing.credits });
    }

    if (existing.status === "failed" || existing.status === "cancelled") {
      return NextResponse.json({ status: "failed" });
    }

    // status === 'created' — verify via the correct gateway
    const gatewayDoc = await PaymentGateway.findOne({
      slug: existing.gatewaySlug || "cashfree",
    });

    if (!gatewayDoc) {
      return NextResponse.json({ status: "pending" });
    }

    const gateway = buildGatewayFromDoc(gatewayDoc);
    const result = await gateway.verifyPayment(existing.orderId);

    if (result.status === "paid") {
      // Atomic update: status 'created' → 'paid', exactly once regardless of concurrent webhook + frontend verify
      const payment = await Payment.findOneAndUpdate(
        { orderId, status: "created" },
        { $set: { status: "paid" } },
        { new: false }
      );

      if (!payment) {
        // Already processed by webhook or another concurrent request
        return NextResponse.json({ status: "paid", type: existing.type, credits: existing.credits });
      }

      if (payment.type === "credit_pack") {
        await processCreditPackPayment(payment);
      } else if (payment.type === "plan") {
        await processPlanPayment(payment);
      }

      return NextResponse.json({ status: "paid", type: payment.type, credits: payment.credits });
    }

    if (result.status === "pending") {
      return NextResponse.json({ status: "pending" });
    }

    if (result.status === "expired") {
      await Payment.findOneAndUpdate(
        { orderId, status: "created" },
        { $set: { status: "failed" } },
        { new: false }
      );
      return NextResponse.json({ status: "failed" });
    }

    return NextResponse.json({ status: existing.status });
  } catch (err) {
    console.error("[verify-payment]", err);
    return NextResponse.json({ error: "Failed to verify payment" }, { status: 500 });
  }
}
