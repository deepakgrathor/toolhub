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
    const payment = await Payment.findOne({ orderId, userId: session.user.id });

    if (!payment) {
      return NextResponse.json({ status: "not_found" });
    }

    if (payment.status === "paid") {
      return NextResponse.json({ status: "paid", type: payment.type, credits: payment.credits });
    }

    if (payment.status === "failed" || payment.status === "cancelled") {
      return NextResponse.json({ status: "failed" });
    }

    // status === 'created' — verify via the correct gateway
    const gatewayDoc = await PaymentGateway.findOne({
      slug: payment.gatewaySlug || "cashfree",
    });

    if (!gatewayDoc) {
      return NextResponse.json({ status: "pending" });
    }

    const gateway = buildGatewayFromDoc(gatewayDoc);
    const result = await gateway.verifyPayment(payment.orderId);

    if (result.status === "paid") {
      payment.status = "paid";
      await payment.save();

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
      payment.status = "failed";
      await payment.save();
      return NextResponse.json({ status: "failed" });
    }

    return NextResponse.json({ status: payment.status });
  } catch (err) {
    console.error("[verify-payment]", err);
    return NextResponse.json({ error: "Failed to verify payment" }, { status: 500 });
  }
}
