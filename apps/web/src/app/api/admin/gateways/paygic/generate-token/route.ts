import { NextRequest, NextResponse } from "next/server";
import { connectDB, PaymentGateway } from "@toolhub/db";
import { requireAdmin } from "@/lib/admin-auth";
import { PaygicGateway } from "@/lib/gateways/paygic";
import { invalidateGatewayCache } from "@/lib/gateways/manager";
import type { GatewayConfig } from "@/lib/gateways/types";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    await connectDB();

    const doc = await PaymentGateway.findOne({ slug: "paygic" });
    if (!doc) {
      return NextResponse.json({ error: "Paygic gateway not found" }, { status: 404 });
    }

    const mid = doc.config.merchantId || process.env.PAYGIC_MID;
    const password = doc.config.secretKey || process.env.PAYGIC_PASSWORD;

    if (!mid || !password) {
      return NextResponse.json(
        { error: "Paygic credentials not configured. Add MID and Password first." },
        { status: 400 }
      );
    }

    const config: GatewayConfig = {
      apiKey: "",
      secretKey: password,
      merchantId: mid,
      webhookSecret: "",
      token: "",
      environment: doc.environment,
      extraConfig: {},
    };

    const gateway = new PaygicGateway(config);
    const token = await gateway.generateToken();

    await PaymentGateway.findOneAndUpdate(
      { slug: "paygic" },
      {
        "config.token": token,
        "config.tokenGeneratedAt": new Date(),
      }
    );

    await invalidateGatewayCache();

    return NextResponse.json({ success: true, message: "Token generated successfully" });
  } catch (err) {
    console.error("[paygic/generate-token]", err);
    const message = err instanceof Error ? err.message : "Failed to generate token";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
