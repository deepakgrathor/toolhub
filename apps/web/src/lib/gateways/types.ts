export interface CreateOrderParams {
  orderId: string;
  amount: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  orderNote: string;
  returnUrl: string;
  callbackUrl: string;
}

export interface OrderResult {
  gatewayOrderId: string;
  // Cashfree:
  paymentSessionId?: string;
  // Paygic:
  upiIntent?: string;
  phonePeLink?: string;
  paytmLink?: string;
  gpayLink?: string;
  dynamicQR?: string;
  expiresIn?: number;
}

export type PaymentStatus = "pending" | "paid" | "failed" | "expired";

export interface VerifyResult {
  status: PaymentStatus;
  gatewayTxnId?: string;
  paymentMethod?: string;
  paidAt?: Date;
}

export interface GatewayCheckoutPayload {
  gatewaySlug: string;
  orderResult: OrderResult;
}

export interface IGateway {
  slug: string;
  createOrder(params: CreateOrderParams): Promise<OrderResult>;
  verifyPayment(merchantReferenceId: string): Promise<VerifyResult>;
  verifyWebhook(body: string, headers: Record<string, string>): boolean;
}

export interface GatewayConfig {
  apiKey: string;
  secretKey: string;
  merchantId: string;
  webhookSecret: string;
  token: string;
  environment: "sandbox" | "production";
  extraConfig: Record<string, unknown>;
}
