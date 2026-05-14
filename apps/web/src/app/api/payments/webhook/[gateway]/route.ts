import { connectDB, PaymentGateway, Payment } from "@toolhub/db";
import { buildGatewayFromDoc } from "@/lib/gateways/manager";
import { processCreditPackPayment, processPlanPayment } from "@/lib/payment-processor";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: { gateway: string } }
) {
  const gatewaySlug = params.gateway;

  try {
    const rawBody = await req.text();
    const headers: Record<string, string> = {};
    req.headers.forEach((value, key) => {
      headers[key] = value;
    });

    await connectDB();

    const gatewayDoc = await PaymentGateway.findOne({ slug: gatewaySlug });
    if (!gatewayDoc) {
      return Response.json({ error: "Gateway not found" }, { status: 404 });
    }

    const gateway = buildGatewayFromDoc(gatewayDoc);

    const isValid = gateway.verifyWebhook(rawBody, headers);
    if (!isValid && gatewaySlug === "cashfree") {
      console.error(`[Webhook/${gatewaySlug}] Invalid signature`);
      return Response.json({ error: "Invalid signature" }, { status: 401 });
    }

    let event: Record<string, unknown>;
    try {
      event = JSON.parse(rawBody);
    } catch {
      return Response.json({ received: true });
    }

    let merchantReferenceId: string | undefined;
    let txnStatus: string | undefined;

    if (gatewaySlug === "paygic") {
      merchantReferenceId = (event.data as Record<string, string>)?.merchantReferenceId;
      txnStatus = event.txnStatus as string;
    } else if (gatewaySlug === "cashfree") {
      if (event.type !== "PAYMENT_SUCCESS_WEBHOOK") {
        return Response.json({ received: true });
      }
      merchantReferenceId = ((event.data as Record<string, Record<string, string>>)?.order)?.order_id;
      txnStatus = "SUCCESS";
    }

    if (!merchantReferenceId) {
      return Response.json({ received: true });
    }

    const payment = await Payment.findOne({ orderId: merchantReferenceId });
    if (!payment) {
      return Response.json({ received: true });
    }
    if (payment.status === "paid") {
      return Response.json({ received: true });
    }

    // Paygic: double-verify via API
    if (gatewaySlug === "paygic" && txnStatus === "SUCCESS") {
      const verifyResult = await gateway.verifyPayment(merchantReferenceId);
      if (verifyResult.status !== "paid") {
        console.log("[Paygic Webhook] API verify failed:", merchantReferenceId);
        return Response.json({ received: true });
      }
    }

    payment.status = "paid";
    const dataObj = event.data as Record<string, Record<string, string>>;
    payment.cashfreePaymentId =
      String(dataObj?.payment?.cf_payment_id || dataObj?.paygicReferenceId || dataObj?.UTR || "") || undefined;
    payment.paymentMethod =
      gatewaySlug === "paygic" ? "upi" : dataObj?.payment?.payment_method || undefined;
    await payment.save();

    if (payment.type === "credit_pack") {
      await processCreditPackPayment(payment);
    } else {
      await processPlanPayment(payment);
    }

    return Response.json({ received: true });
  } catch (err) {
    console.error(`[Webhook/${gatewaySlug}]`, err);
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}
