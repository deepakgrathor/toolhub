import { NextRequest, NextResponse } from "next/server";
import { connectDB, PaymentGateway } from "@toolhub/db";
import { requireAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

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
