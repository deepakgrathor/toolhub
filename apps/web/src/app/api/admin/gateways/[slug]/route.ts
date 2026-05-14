import { NextRequest, NextResponse } from "next/server";
import { connectDB, PaymentGateway, AuditLog } from "@toolhub/db";
import { requireAdmin } from "@/lib/admin-auth";
import { invalidateGatewayCache } from "@/lib/gateways/manager";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    await connectDB();

    const { slug } = params;
    const body = await req.json();

    const gateway = await PaymentGateway.findOne({ slug });
    if (!gateway) {
      return NextResponse.json({ error: "Gateway not found" }, { status: 404 });
    }

    // Build update object
    const update: Record<string, unknown> = {};

    if (typeof body.isActive === "boolean") update.isActive = body.isActive;
    if (typeof body.isDefault === "boolean") update.isDefault = body.isDefault;
    if (body.environment) update.environment = body.environment;

    // Config fields — only update non-empty values (preserve existing secrets if blank)
    if (body.config) {
      if (body.config.apiKey !== undefined && body.config.apiKey !== "" && !body.config.apiKey.startsWith("••")) {
        update["config.apiKey"] = body.config.apiKey;
      }
      if (body.config.secretKey !== undefined && body.config.secretKey !== "" && !body.config.secretKey.startsWith("••")) {
        update["config.secretKey"] = body.config.secretKey;
      }
      if (body.config.merchantId !== undefined && body.config.merchantId !== "") {
        update["config.merchantId"] = body.config.merchantId;
      }
      if (body.config.webhookSecret !== undefined && body.config.webhookSecret !== "" && !body.config.webhookSecret.startsWith("••")) {
        update["config.webhookSecret"] = body.config.webhookSecret;
      }
    }

    // If setting as default, clear all others first
    if (body.isDefault === true) {
      await PaymentGateway.updateMany(
        { slug: { $ne: slug } },
        { $set: { isDefault: false } }
      );
    }

    await PaymentGateway.findOneAndUpdate({ slug }, { $set: update });

    // Invalidate gateway cache
    await invalidateGatewayCache();

    // Audit log
    await AuditLog.create({
      action: `gateway_update`,
      targetType: "payment_gateway",
      targetId: slug,
      details: { slug, fields: Object.keys(update) },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[admin/gateways PATCH]", err);
    return NextResponse.json({ error: "Failed to update gateway" }, { status: 500 });
  }
}
