import { Schema, Document, Model, getOrCreateModel } from "../lib/mongoose-shim";
import type { Types } from "mongoose";

export interface IBillingSnapshot {
  accountType: string;
  fullName: string;
  businessName: string;
  gstin: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

export interface IPayment extends Document {
  userId: Types.ObjectId;
  orderId: string;
  cashfreeOrderId: string;
  gatewaySlug: string;
  gatewayOrderId: string;
  type: "credit_pack" | "plan";

  // Credit pack
  packId?: Types.ObjectId | null;
  credits: number;

  // Plan
  planSlug?: string | null;
  billingCycle?: "monthly" | "yearly" | null;

  // Amounts
  amount: number;
  gstAmount: number;
  totalAmount: number;
  currency: string;

  // Status
  status: "created" | "paid" | "failed" | "cancelled";

  // Cashfree
  paymentSessionId: string;
  cashfreePaymentId?: string | null;
  paymentMethod?: string | null;

  // Invoice
  invoiceNumber?: string | null;

  // Billing snapshot at time of payment
  billingSnapshot: IBillingSnapshot;

  createdAt: Date;
  updatedAt: Date;
}

const BillingSnapshotSchema = new Schema<IBillingSnapshot>(
  {
    accountType: { type: String, default: "" },
    fullName: { type: String, default: "" },
    businessName: { type: String, default: "" },
    gstin: { type: String, default: "" },
    address: { type: String, default: "" },
    city: { type: String, default: "" },
    state: { type: String, default: "" },
    pincode: { type: String, default: "" },
  },
  { _id: false }
);

const PaymentSchema = new Schema<IPayment>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    orderId: { type: String, required: true, unique: true, index: true },
    cashfreeOrderId: { type: String, default: "" },
    gatewaySlug: { type: String, default: "cashfree" },
    gatewayOrderId: { type: String, default: "" },
    type: { type: String, enum: ["credit_pack", "plan"], required: true },

    // Credit pack
    packId: { type: Schema.Types.ObjectId, ref: "CreditPack", default: null },
    credits: { type: Number, default: 0 },

    // Plan
    planSlug: { type: String, default: null },
    billingCycle: { type: String, enum: ["monthly", "yearly", null], default: null },

    // Amounts
    amount: { type: Number, required: true },
    gstAmount: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    currency: { type: String, default: "INR" },

    // Status
    status: {
      type: String,
      enum: ["created", "paid", "failed", "cancelled"],
      default: "created",
    },

    // Gateway details
    paymentSessionId: { type: String, default: "" },
    cashfreePaymentId: { type: String, default: null },
    paymentMethod: { type: String, default: null },

    // Invoice
    invoiceNumber: { type: String, default: null },

    // Billing snapshot
    billingSnapshot: { type: BillingSnapshotSchema, required: true },
  },
  { timestamps: true }
);

export const Payment: Model<IPayment> = getOrCreateModel<IPayment>("Payment", PaymentSchema);
