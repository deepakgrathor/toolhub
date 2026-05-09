import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB, CreditPack } from "@toolhub/db";
import { z } from "zod";
import { createRateLimit } from "@/lib/rate-limit";

const purchaseLimiter = createRateLimit({ windowMs: 3_600_000, max: 10 });

export const dynamic = "force-dynamic";

const schema = z.object({ packId: z.string().min(1) });

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limit = purchaseLimiter(session.user.id);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many purchase attempts. Try again later." },
      { status: 429 }
    );
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  await connectDB();

  const pack = await CreditPack.findById(parsed.data.packId).lean();
  if (!pack || !pack.isActive) {
    return NextResponse.json({ error: "Pack not found" }, { status: 404 });
  }

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    console.error("[POST /api/credits/purchase] Razorpay keys not configured");
    return NextResponse.json({ error: "Payment not configured" }, { status: 503 });
  }

  const authHeader =
    "Basic " + Buffer.from(`${keyId}:${keySecret}`).toString("base64");

  // Razorpay receipt max 40 chars
  const receipt = `${session.user.id}_${parsed.data.packId}`.slice(0, 40);

  const orderRes = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: authHeader,
    },
    body: JSON.stringify({
      amount: pack.priceInr * 100, // paise
      currency: "INR",
      receipt,
      notes: {
        userId: session.user.id,
        packId: parsed.data.packId,
      },
    }),
  });

  if (!orderRes.ok) {
    const err = await orderRes.json().catch(() => ({}));
    console.error("[POST /api/credits/purchase] Razorpay error:", err);
    return NextResponse.json({ error: "Failed to create order" }, { status: 502 });
  }

  const order = await orderRes.json();

  return NextResponse.json({
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    packName: pack.name,
    credits: pack.credits,
  });
}
