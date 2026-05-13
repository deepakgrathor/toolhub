import { connectDB, Payment } from "@toolhub/db";
import { verifyCashfreeWebhook } from "@/lib/cashfree";
import { processCreditPackPayment, processPlanPayment } from "@/lib/payment-processor";

export async function POST(req: Request) {
  try {
    // STEP 1 — Get raw body + headers
    const rawBody = await req.text();
    const timestamp = req.headers.get("x-webhook-timestamp") || "";
    const signature = req.headers.get("x-webhook-signature") || "";

    // STEP 2 — Verify signature
    const isValid = verifyCashfreeWebhook(rawBody, timestamp, signature);
    if (!isValid) {
      console.error("[Webhook] Invalid signature");
      return Response.json({ error: "Invalid signature" }, { status: 401 });
    }

    // STEP 3 — Parse body
    const event = JSON.parse(rawBody);
    const eventType: string = event.type;
    const orderId: string = event.data?.order?.order_id;

    // STEP 4 — Handle only payment success
    if (eventType !== "PAYMENT_SUCCESS_WEBHOOK") {
      return Response.json({ received: true });
    }

    await connectDB();

    // STEP 5 — Find payment doc
    const payment = await Payment.findOne({ orderId });
    if (!payment) {
      console.error("[Webhook] Payment not found:", orderId);
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    // Idempotent — already processed
    if (payment.status === "paid") {
      return Response.json({ received: true });
    }

    // STEP 6 — Update payment status
    payment.status = "paid";
    payment.cashfreePaymentId = event.data?.payment?.cf_payment_id;
    payment.paymentMethod = event.data?.payment?.payment_method;
    await payment.save();

    // STEP 7 — Process based on type
    if (payment.type === "credit_pack") {
      await processCreditPackPayment(payment);
    } else if (payment.type === "plan") {
      await processPlanPayment(payment);
    }

    // STEP 8 — Return success
    return Response.json({ received: true });
  } catch (err) {
    console.error("[Webhook] Error:", err);
    // Never throw — Cashfree retries on non-200
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}
