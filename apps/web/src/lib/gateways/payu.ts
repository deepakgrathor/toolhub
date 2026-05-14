import type { IGateway, CreateOrderParams, OrderResult, VerifyResult, GatewayConfig } from "./types";

export class PayuGateway implements IGateway {
  slug = "payu";
  private config: GatewayConfig;

  constructor(config: GatewayConfig) {
    this.config = config;
  }

  async createOrder(_params: CreateOrderParams): Promise<OrderResult> {
    throw new Error("PayU integration coming soon");
  }

  async verifyPayment(_orderId: string): Promise<VerifyResult> {
    throw new Error("PayU integration coming soon");
  }

  verifyWebhook(_body: string, _headers: Record<string, string>): boolean {
    return false;
  }
}
