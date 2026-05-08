import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { connectDB, CreditPack, CreditService, CreditTransaction } from "@toolhub/db";

export const dynamic = "force-dynamic";

interface RazorpayPaymentEntity {
  id: string;
  order_id: string;
  notes?: Record<string, string>;
}

interface RazorpayEvent {
  event: string;
  payload: {
    payment: {
      entity: RazorpayPaymentEntity;
    };
  };
}

// Always returns 200 — Razorpay retries on non-200
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-razorpay-signature") ?? "";
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET ?? "";

  const expected = crypto
    .createHmac("sha256", webhookSecret)
    .update(rawBody)
    .digest("hex");

  if (expected !== signature) {
    console.warn("[webhook/razorpay] Invalid signature — ignoring");
    return NextResponse.json({ ok: false }, { status: 200 });
  }

  let event: RazorpayEvent;
  try {
    event = JSON.parse(rawBody);
  } catch {
    console.error("[webhook/razorpay] Failed to parse body");
    return NextResponse.json({ ok: false }, { status: 200 });
  }

  if (event.event !== "payment.captured") {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  const payment = event.payload.payment.entity;
  const paymentId = payment.id;
  const orderId = payment.order_id;
  const { userId, packId } = payment.notes ?? {};

  if (!userId || !packId) {
    console.warn("[webhook/razorpay] Missing notes.userId or notes.packId", { paymentId });
    return NextResponse.json({ ok: false }, { status: 200 });
  }

  await connectDB();

  // Idempotency — skip if this payment was already processed
  const existing = await CreditTransaction.findOne({
    "meta.paymentId": paymentId,
  }).lean();

  if (existing) {
    console.log("[webhook/razorpay] Already processed:", paymentId);
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  const pack = await CreditPack.findById(packId).lean();
  if (!pack) {
    console.error("[webhook/razorpay] Pack not found:", packId);
    return NextResponse.json({ ok: false }, { status: 200 });
  }

  try {
    await CreditService.addCredits(userId, pack.credits, "purchase", {
      orderId,
      paymentId,
      packId,
      packName: pack.name,
    });
    console.log(
      `[webhook/razorpay] Added ${pack.credits} credits to user ${userId} (payment: ${paymentId})`
    );
  } catch (err) {
    console.error("[webhook/razorpay] addCredits failed:", err);
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
