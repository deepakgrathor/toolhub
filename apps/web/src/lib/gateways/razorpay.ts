import type { IGateway, CreateOrderParams, OrderResult, VerifyResult, GatewayConfig } from "./types";

export class RazorpayGateway implements IGateway {
  slug = "razorpay";
  private config: GatewayConfig;

  constructor(config: GatewayConfig) {
    this.config = config;
  }

  async createOrder(_params: CreateOrderParams): Promise<OrderResult> {
    throw new Error("Razorpay integration coming soon");
  }

  async verifyPayment(_orderId: string): Promise<VerifyResult> {
    throw new Error("Razorpay integration coming soon");
  }

  verifyWebhook(_body: string, _headers: Record<string, string>): boolean {
    return false;
  }
}
