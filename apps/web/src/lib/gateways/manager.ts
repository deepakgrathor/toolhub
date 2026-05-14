import { connectDB, PaymentGateway, type IPaymentGateway } from "@toolhub/db";
import { PaygicGateway } from "./paygic";
import { CashfreeGateway } from "./cashfree";
import { RazorpayGateway } from "./razorpay";
import { PayuGateway } from "./payu";
import type { IGateway, GatewayConfig } from "./types";
import { getRedis } from "@toolhub/shared";

const CACHE_KEY = "SetuLix:active_gateway";
const CACHE_TTL = 300;

export async function getActiveGateway(): Promise<IGateway> {
  const redis = getRedis();

  const cached = await redis.get<{ slug: string; config: GatewayConfig }>(CACHE_KEY);
  if (cached && cached.slug) {
    return buildGateway(cached.slug, cached.config);
  }

  await connectDB();

  const gateway = await PaymentGateway.findOne({ isDefault: true, isActive: true });

  if (!gateway) {
    throw new Error(
      "No active payment gateway configured. Please set a default gateway in admin panel."
    );
  }

  const config: GatewayConfig = {
    apiKey: gateway.config.apiKey || "",
    secretKey: gateway.config.secretKey || "",
    merchantId: gateway.config.merchantId || "",
    webhookSecret: gateway.config.webhookSecret || "",
    token: gateway.config.token || "",
    environment: gateway.environment,
    extraConfig: (gateway.config.extraConfig as Record<string, unknown>) || {},
  };

  await redis.set(CACHE_KEY, { slug: gateway.slug, config }, { ex: CACHE_TTL });

  return buildGateway(gateway.slug, config);
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
    environment: doc.environment,
    extraConfig: {},
  };

  return { gateway: new PaygicGateway(config), doc };
}
