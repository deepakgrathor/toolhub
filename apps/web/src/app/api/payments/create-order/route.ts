import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB, User, CreditPack, Plan, BillingProfile, Payment } from "@toolhub/db";
import { z } from "zod";
import { createCashfreeOrder } from "@/lib/cashfree";
import { generateOrderId } from "@/lib/order-id";

const billingDetailsSchema = z.object({
  accountType: z.enum(["individual", "business"]),
  fullName: z.string().min(1),
  phone: z.string().min(10),
  businessName: z.string().optional(),
  gstin: z.string().optional(),
  address: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(1),
  pincode: z.string().min(6),
});

const bodySchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("credit_pack"),
    packId: z.string().min(1),
    billingDetails: billingDetailsSchema,
    saveBilling: z.boolean().default(true),
  }),
  z.object({
    type: z.literal("plan"),
    planSlug: z.string().min(1),
    billingCycle: z.enum(["monthly", "yearly"]),
    billingDetails: billingDetailsSchema,
    saveBilling: z.boolean().default(true),
  }),
]);

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    await connectDB();

    // STEP 1 — Get user
    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    if (user.isDeleted) {
      return NextResponse.json({ error: "Account is deleted" }, { status: 403 });
    }

    const data = parsed.data;
    const { billingDetails, saveBilling } = data;

    let subtotal = 0;
    let credits = 0;
    let orderNote = "";

    // STEP 2 — Calculate amount
    if (data.type === "credit_pack") {
      const pack = await CreditPack.findById(data.packId);
      if (!pack || !pack.isActive) {
        return NextResponse.json({ error: "Credit pack not found" }, { status: 404 });
      }
      subtotal = pack.price;
      credits = pack.credits;
      orderNote = `SetuLix Credit Pack — ${pack.credits} Credits`;
    } else {
      const plan = await Plan.findOne({ slug: data.planSlug });
      if (!plan || !plan.isActive) {
        return NextResponse.json({ error: "Plan not found" }, { status: 404 });
      }
      subtotal =
        data.billingCycle === "yearly"
          ? plan.pricing.yearly.basePrice
          : plan.pricing.monthly.basePrice;
      credits =
        data.billingCycle === "yearly"
          ? plan.pricing.yearly.baseCredits
          : plan.pricing.monthly.baseCredits;
      orderNote = `SetuLix ${plan.name} Plan — ${data.billingCycle}`;
    }

    const gstAmount = Math.round(subtotal * 0.18);
    const totalAmount = subtotal + gstAmount;

    // STEP 3 — Save billing if requested
    if (saveBilling) {
      await BillingProfile.findOneAndUpdate(
        { userId: user._id },
        {
          userId: user._id,
          accountType: billingDetails.accountType,
          fullName: billingDetails.fullName,
          phone: billingDetails.phone,
          businessName: billingDetails.businessName || "",
          gstin: billingDetails.gstin || "",
          address: billingDetails.address,
          city: billingDetails.city,
          state: billingDetails.state,
          pincode: billingDetails.pincode,
        },
        { upsert: true, new: true }
      );
    }

    // STEP 4 — Generate order ID
    const orderId = generateOrderId();

    // STEP 5 — Return URL
    const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL}/payment/return?order_id=${orderId}`;

    // STEP 6 — Create Cashfree order
    const cashfreeOrder = await createCashfreeOrder({
      orderId,
      amount: totalAmount,
      customerName: billingDetails.fullName,
      customerEmail: user.email,
      customerPhone: billingDetails.phone,
      orderNote,
      returnUrl,
    });

    // STEP 7 — Save Payment doc
    await Payment.create({
      userId: user._id,
      orderId,
      cashfreeOrderId: orderId,
      type: data.type,
      packId: data.type === "credit_pack" ? data.packId : undefined,
      credits,
      planSlug: data.type === "plan" ? data.planSlug : undefined,
      billingCycle: data.type === "plan" ? data.billingCycle : undefined,
      amount: subtotal,
      gstAmount,
      totalAmount,
      status: "created",
      paymentSessionId: cashfreeOrder.payment_session_id,
      billingSnapshot: {
        accountType: billingDetails.accountType,
        fullName: billingDetails.fullName,
        businessName: billingDetails.businessName || "",
        gstin: billingDetails.gstin || "",
        address: billingDetails.address,
        city: billingDetails.city,
        state: billingDetails.state,
        pincode: billingDetails.pincode,
      },
    });

    // STEP 8 — Return
    return NextResponse.json({
      orderId,
      paymentSessionId: cashfreeOrder.payment_session_id,
    });
  } catch (err) {
    console.error("[create-order]", err);
    return NextResponse.json(
      { error: "Failed to create order. Please try again." },
      { status: 500 }
    );
  }
}
