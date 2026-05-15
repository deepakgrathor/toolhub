import { Cashfree, CFEnvironment } from "cashfree-pg";
import type { IGateway, CreateOrderParams, OrderResult, VerifyResult, GatewayConfig } from "./types";
import crypto from "crypto";

export class CashfreeGateway implements IGateway {
  slug = "cashfree";
  private config: GatewayConfig;
  private client: InstanceType<typeof Cashfree>;

  constructor(config: GatewayConfig) {
    this.config = config;
    this.client = new Cashfree(
      config.environment === "production" ? CFEnvironment.PRODUCTION : CFEnvironment.SANDBOX,
      config.apiKey,
      config.secretKey
    );
  }

  async createOrder(params: CreateOrderParams): Promise<OrderResult> {
    const request = {
      order_id: params.orderId,
      order_amount: params.amount,
      order_currency: "INR",
      order_note: params.orderNote,
      customer_details: {
        customer_id: params.customerEmail.replace(/[^a-zA-Z0-9]/g, "_"),
        customer_name: params.customerName,
        customer_email: params.customerEmail,
        customer_phone: params.customerPhone || "9999999999",
      },
      order_meta: {
        return_url: params.returnUrl,
        notify_url: params.callbackUrl,
      },
    };

    const response = await this.client.PGCreateOrder(request);
    const data = response.data;

    return {
      gatewayOrderId: data.order_id || params.orderId,
      paymentSessionId: data.payment_session_id,
    };
  }

  async verifyPayment(orderId: string): Promise<VerifyResult> {
    try {
      const response = await this.client.PGFetchOrder(orderId);
      const data = response.data;

      if (data.order_status === "PAID") {
        return {
          status: "paid",
          gatewayTxnId: data.cf_order_id?.toString(),
          paidAt: new Date(),
        };
      }

      if (data.order_status === "ACTIVE") {
        return { status: "pending" };
      }

      return { status: "failed" };
    } catch {
      return { status: "failed" };
    }
  }

  verifyWebhook(body: string, headers: Record<string, string>): boolean {
    const timestamp = headers["x-webhook-timestamp"] || "";
    const signature = headers["x-webhook-signature"] || "";
    const webhookSecret = this.config.webhookSecret;

    if (!webhookSecret || !timestamp || !signature) return false;

    const signedPayload = timestamp + body;
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(signedPayload)
      .digest("base64");

    const expected = Buffer.from(expectedSignature);
    const received = Buffer.from(signature);

    if (expected.length !== received.length) {
      return false;
    }

    return crypto.timingSafeEqual(expected, received);
  }
}
