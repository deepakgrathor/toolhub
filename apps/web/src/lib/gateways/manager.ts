import { connectDB, PaymentGateway, type IPaymentGateway } from "@toolhub/db";
import { PaygicGateway } from "./paygic";
import { CashfreeGateway } from "./cashfree";
import { RazorpayGateway } from "./razorpay";
import { PayuGateway } from "./payu";
import type { IGateway, GatewayConfig } from "./types";
import { getRedis } from "@toolhub/shared";

// Slug-only cache — credentials are never stored in Redis
const CACHE_KEY = "active_gateway:slug";
// Old key that stored full config (including secrets) — always delete on access
const OLD_CACHE_KEY = "SetuLix:active_gateway";
const CACHE_TTL = 300;

export async function getActiveGateway(): Promise<IGateway> {
  const redis = getRedis();

  // Clean up old key that stored credentials in Redis (one-time migration, no-op once gone)
  void redis.del(OLD_CACHE_KEY).catch(() => {});

  const cachedSlug = await redis.get<string>(CACHE_KEY);

  await connectDB();

  let gatewayDoc = null;

  if (cachedSlug) {
    gatewayDoc = await PaymentGateway.findOne({ slug: cachedSlug, isActive: true }).lean();
  }

  if (!gatewayDoc) {
    // Cache miss or stale slug — fetch default gateway from MongoDB
    gatewayDoc = await PaymentGateway.findOne({ isDefault: true, isActive: true }).lean();

    if (!gatewayDoc) {
      throw new Error(
        "No active payment gateway configured. Please set a default gateway in admin panel."
      );
    }

    // Cache only the slug — never cache secrets
    await redis.set(CACHE_KEY, gatewayDoc.slug, { ex: CACHE_TTL });
  }

  const config: GatewayConfig = {
    apiKey: gatewayDoc.config.apiKey || "",
    secretKey: gatewayDoc.config.secretKey || "",
    merchantId: gatewayDoc.config.merchantId || "",
    webhookSecret: gatewayDoc.config.webhookSecret || "",
    token: gatewayDoc.config.token || "",
    environment: gatewayDoc.environment as "sandbox" | "production",
    extraConfig: (gatewayDoc.config.extraConfig as Record<string, unknown>) || {},
  };

  return buildGateway(gatewayDoc.slug, config);
}

export function buildGateway(slug: string, config: GatewayConfig): IGateway {
  switch (slug) {
    case "paygic":
      return new PaygicGateway(config);
    case "cashfree":
      return new CashfreeGateway(config);
    case "razorpay":
      return new RazorpayGateway(config);
    case "payu":
      return new PayuGateway(config);
    default:
      throw new Error(`Unknown gateway: ${slug}`);
  }
}

export function buildGatewayFromDoc(doc: {
  slug: string;
  environment: "sandbox" | "production";
  config: {
    apiKey?: string;
    secretKey?: string;
    merchantId?: string;
    webhookSecret?: string;
    token?: string;
    extraConfig?: Record<string, unknown>;
  };
}): IGateway {
  const config: GatewayConfig = {
    apiKey: doc.config.apiKey || "",
    secretKey: doc.config.secretKey || "",
    merchantId: doc.config.merchantId || "",
    webhookSecret: doc.config.webhookSecret || "",
    token: doc.config.token || "",
    environment: doc.environment,
    extraConfig: doc.config.extraConfig || {},
  };
  return buildGateway(doc.slug, config);
}

export async function invalidateGatewayCache(): Promise<void> {
  const redis = getRedis();
  await redis.del(CACHE_KEY);
  // Also clean up old key that stored credentials
  await redis.del(OLD_CACHE_KEY).catch(() => {});
}

export async function getActiveGatewaySlug(): Promise<string> {
  await connectDB();
  const gateway = await PaymentGateway.findOne({ isDefault: true, isActive: true }).select("slug");
  return gateway?.slug || "cashfree";
}

export async function getPaygicGateway(): Promise<{
  gateway: PaygicGateway;
  doc: IPaymentGateway;
}> {
  await connectDB();
  const doc = await PaymentGateway.findOne({ slug: "paygic" });
  if (!doc) throw new Error("Paygic gateway not configured");

  const config: GatewayConfig = {
    apiKey: "",
    secretKey: doc.config.secretKey || "",
    merchantId: doc.config.merchantId || process.env.PAYGIC_MID || "",
    webhookSecret: "",
    token: doc.config.token || "",
    environment: doc.environment as "sandbox" | "production",
    extraConfig: {},
  };

  return { gateway: new PaygicGateway(config), doc };
}
