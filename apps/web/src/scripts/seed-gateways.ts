/**
 * Seed payment gateway docs (Paygic + Cashfree).
 * Run: MONGODB_URI="$MONGODB_URI" npx tsx apps/web/src/scripts/seed-gateways.ts
 * Safe to re-run — uses upsert by slug.
 */

import mongoose from "mongoose";

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI not set");
  process.exit(1);
}

const GatewaySchema = new mongoose.Schema({
  slug: { type: String, unique: true, required: true },
  name: String,
  isActive: { type: Boolean, default: true },
  isDefault: { type: Boolean, default: false },
  priority: { type: Number, default: 0 },
  environment: { type: String, default: "sandbox" },
  config: {
    apiKey: { type: String, default: "" },
    secretKey: { type: String, default: "" },
    merchantId: { type: String, default: "" },
    webhookSecret: { type: String, default: "" },
    token: { type: String, default: "" },
    tokenGeneratedAt: { type: Date, default: null },
    extraConfig: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  supports: {
    upi: { type: Boolean, default: false },
    cards: { type: Boolean, default: false },
    netbanking: { type: Boolean, default: false },
    wallets: { type: Boolean, default: false },
    qr: { type: Boolean, default: false },
  },
  description: { type: String, default: "" },
  logoUrl: { type: String, default: "" },
}, { timestamps: true });

const PaymentGateway = mongoose.model("PaymentGateway", GatewaySchema);

const gateways = [
  {
    slug: "cashfree",
    name: "Cashfree",
    isActive: true,
    isDefault: false,
    priority: 2,
    environment: "sandbox",
    config: {
      apiKey: "",
      secretKey: "",
      merchantId: "",
      webhookSecret: "",
      token: "",
      tokenGeneratedAt: null,
      extraConfig: {},
    },
    supports: {
      upi: true,
      cards: true,
      netbanking: true,
      wallets: true,
      qr: false,
    },
    description: "Full-featured payment gateway. Supports cards, UPI, netbanking.",
    logoUrl: "",
  },
  {
    slug: "paygic",
    name: "Paygic",
    isActive: true,
    isDefault: true,
    priority: 1,
    environment: "production",
    config: {
      apiKey: "",
      secretKey: "",
      merchantId: "",
      webhookSecret: "",
      token: "",
      tokenGeneratedAt: null,
      extraConfig: {},
    },
    supports: {
      upi: true,
      cards: false,
      netbanking: false,
      wallets: false,
      qr: true,
    },
    description: "UPI-only gateway. Supports PhonePe, GPay, Paytm, QR.",
    logoUrl: "",
  },
];

async function seed() {
  await mongoose.connect(uri!);
  console.log("Connected to MongoDB");

  for (const gw of gateways) {
    const result = await PaymentGateway.findOneAndUpdate(
      { slug: gw.slug },
      { $set: gw },
      { upsert: true, new: true }
    );
    console.log(`Upserted: ${result.slug} (isDefault: ${result.isDefault})`);
  }

  const count = await PaymentGateway.countDocuments({});
  console.log(`\nTotal gateways: ${count}`);

  const defaultGw = await PaymentGateway.findOne({ isDefault: true });
  console.log(`Default gateway: ${defaultGw?.slug}`);

  await mongoose.disconnect();
  console.log("Done.");
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
