import mongoose, { Schema, Document, Model, getOrCreateModel } from "../lib/mongoose-shim";

export interface IPaymentGatewayConfig {
  apiKey: string;
  secretKey: string;
  merchantId: string;
  webhookSecret: string;
  token: string;
  tokenGeneratedAt: Date | null;
  extraConfig: Record<string, unknown>;
}

export interface IPaymentGatewaySupports {
  upi: boolean;
  cards: boolean;
  netbanking: boolean;
  wallets: boolean;
  qr: boolean;
}

export interface IPaymentGateway extends Document {
  slug: "cashfree" | "paygic" | "razorpay" | "payu";
  name: string;
  isActive: boolean;
  isDefault: boolean;
  priority: number;
  environment: "sandbox" | "production";
  config: IPaymentGatewayConfig;
  supports: IPaymentGatewaySupports;
  description: string;
  logoUrl: string;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentGatewayConfigSchema = new Schema<IPaymentGatewayConfig>(
  {
    apiKey: { type: String, default: "" },
    secretKey: { type: String, default: "" },
    merchantId: { type: String, default: "" },
    webhookSecret: { type: String, default: "" },
    token: { type: String, default: "" },
    tokenGeneratedAt: { type: Date, default: null },
    extraConfig: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { _id: false }
);

const PaymentGatewaySupportsSchema = new Schema<IPaymentGatewaySupports>(
  {
    upi: { type: Boolean, default: false },
    cards: { type: Boolean, default: false },
    netbanking: { type: Boolean, default: false },
    wallets: { type: Boolean, default: false },
    qr: { type: Boolean, default: false },
  },
  { _id: false }
);

const PaymentGatewaySchema = new Schema<IPaymentGateway>(
  {
    slug: {
      type: String,
      enum: ["cashfree", "paygic", "razorpay", "payu"],
      unique: true,
      required: true,
    },
    name: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    isDefault: { type: Boolean, default: false },
    priority: { type: Number, default: 0 },
    environment: {
      type: String,
      enum: ["sandbox", "production"],
      default: "sandbox",
    },
    config: { type: PaymentGatewayConfigSchema, default: () => ({}) },
    supports: { type: PaymentGatewaySupportsSchema, default: () => ({}) },
    description: { type: String, default: "" },
    logoUrl: { type: String, default: "" },
  },
  { timestamps: true }
);

export const PaymentGateway: Model<IPaymentGateway> = getOrCreateModel<IPaymentGateway>(
  "PaymentGateway",
  PaymentGatewaySchema
);
