import { NextRequest, NextResponse } from "next/server";
import { connectDB, PaymentGateway } from "@toolhub/db";
import { requireAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

const DEFAULT_GATEWAYS = [
  {
    slug: "paygic",
    name: "Paygic",
    isActive: true,
    isDefault: true,
    priority: 1,
    environment: "production",
    config: { apiKey: "", secretKey: "", merchantId: "", webhookSecret: "", token: "", tokenGeneratedAt: null, extraConfig: {} },
    supports: { upi: true, cards: false, netbanking: false, wallets: false, qr: true },
    description: "UPI-only gateway. Supports PhonePe, GPay, Paytm, QR.",
    logoUrl: "",
  },
  {
    slug: "cashfree",
    name: "Cashfree",
    isActive: true,
    isDefault: false,
    priority: 2,
    environment: "sandbox",
    config: { apiKey: "", secretKey: "", merchantId: "", webhookSecret: "", token: "", tokenGeneratedAt: null, extraConfig: {} },
    supports: { upi: true, cards: true, netbanking: true, wallets: true, qr: false },
    description: "Full-featured payment gateway. Supports cards, UPI, netbanking.",
    logoUrl: "",
  },
  {
    slug: "razorpay",
    name: "Razorpay",
    isActive: false,
    isDefault: false,
    priority: 3,
    environment: "sandbox",
    config: { apiKey: "", secretKey: "", merchantId: "", webhookSecret: "", token: "", tokenGeneratedAt: null, extraConfig: {} },
    supports: { upi: true, cards: true, netbanking: true, wallets: true, qr: false },
    description: "Coming soon.",
    logoUrl: "",
  },
  {
    slug: "payu",
    name: "PayU",
    isActive: false,
    isDefault: false,
    priority: 4,
    environment: "sandbox",
    config: { apiKey: "", secretKey: "", merchantId: "", webhookSecret: "", token: "", tokenGeneratedAt: null, extraConfig: {} },
    supports: { upi: true, cards: true, netbanking: true, wallets: false, qr: false },
    description: "Coming soon.",
    logoUrl: "",
  },
];

function maskSecret(value: string): string {
  if (!value) return "";
  if (value.length <= 4) return "••••";
  return "••••" + value.slice(-4);
}

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    await connectDB();

    // Auto-seed if collection is empty
    const count = await PaymentGateway.countDocuments({});
    if (count === 0) {
      for (const gw of DEFAULT_GATEWAYS) {
        await PaymentGateway.findOneAndUpdate(
          { slug: gw.slug },
          { $setOnInsert: gw },
          { upsert: true, new: true }
        );
      }
    }

    const gateways = await PaymentGateway.find().sort({ priority: 1 }).lean();

    const masked = gateways.map((gw) => ({
      ...gw,
      config: {
        ...gw.config,
        apiKey: maskSecret(gw.config.apiKey),
        secretKey: "••••••••",
        webhookSecret: gw.config.webhookSecret ? "••••••••" : "",
        merchantId:
          gw.config.merchantId
            ? gw.config.merchantId.length > 4
              ? gw.config.merchantId.slice(0, -4).replace(/./g, "*") + gw.config.merchantId.slice(-4)
              : maskSecret(gw.config.merchantId)
            : "",
        token: gw.config.token ? "Generated" : "Not generated",
        tokenGeneratedAt: gw.config.tokenGeneratedAt,
      },
    }));

    return NextResponse.json({ gateways: masked });
  } catch (err) {
    console.error("[admin/gateways GET]", err);
    return NextResponse.json({ error: "Failed to fetch gateways" }, { status: 500 });
  }
}
