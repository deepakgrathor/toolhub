import type { IGateway, CreateOrderParams, OrderResult, VerifyResult, GatewayConfig } from "./types";

const PAYGIC_BASE = "https://server.paygic.in";

export class PaygicGateway implements IGateway {
  slug = "paygic";
  private config: GatewayConfig;

  constructor(config: GatewayConfig) {
    this.config = config;
  }

  async generateToken(): Promise<string> {
    const res = await fetch(`${PAYGIC_BASE}/api/v3/createMerchantToken`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mid: this.config.merchantId,
        password: this.config.secretKey,
        expiry: false,
      }),
    });

    const data = await res.json();

    if (!data.status || !data.data?.token) {
      throw new Error(`Paygic token generation failed: ${data.msg}`);
    }

    return data.data.token;
  }

  async createOrder(params: CreateOrderParams): Promise<OrderResult> {
    const token = this.config.token;
    if (!token) {
      throw new Error("Paygic token not configured. Generate token from admin panel.");
    }

    const res = await fetch(`${PAYGIC_BASE}/api/v2/createPaymentRequest`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        token,
      },
      body: JSON.stringify({
        mid: this.config.merchantId,
        amount: params.amount,
        merchantReferenceId: params.orderId,
        customer_name: params.customerName,
        customer_email: params.customerEmail,
        customer_mobile: params.customerPhone || "9999999999",
      }),
    });

    const data = await res.json();

    if (!data.status) {
      throw new Error(`Paygic order creation failed: ${data.msg}`);
    }

    return {
      gatewayOrderId: data.data.paygicReferenceId,
      upiIntent: data.data.intent,
      phonePeLink: data.data.phonePe,
      paytmLink: data.data.paytm,
      gpayLink: data.data.gpay,
      dynamicQR: data.data.dynamicQR,
      expiresIn: 300,
    };
  }

  async verifyPayment(merchantReferenceId: string): Promise<VerifyResult> {
    const token = this.config.token;
    if (!token) {
      return { status: "failed" };
    }

    const res = await fetch(`${PAYGIC_BASE}/api/v2/checkPaymentStatus`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        token,
      },
      body: JSON.stringify({
        mid: this.config.merchantId,
        merchantReferenceId,
      }),
    });

    const data = await res.json();

    if (!data.status) {
      return { status: "failed" };
    }

    if (data.txnStatus === "SUCCESS") {
      return {
        status: "paid",
        gatewayTxnId: data.data?.paygicReferenceId,
        paymentMethod: "upi",
        paidAt: data.data?.successDate ? new Date(data.data.successDate) : new Date(),
      };
    }

    if (data.txnStatus === "PENDING") {
      return { status: "pending" };
    }

    if (data.txnStatus === "EXPIRED") {
      return { status: "expired" };
    }

    return { status: "failed" };
  }

  verifyWebhook(_body: string, _headers: Record<string, string>): boolean {
    // Paygic has no signature — we verify via API in webhook handler
    return true;
  }
}
