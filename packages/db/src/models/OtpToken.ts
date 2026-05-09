import mongoose, { Schema, Document, Model } from "../lib/mongoose-shim";

export interface IOtpToken extends Document {
  email: string;
  otp: string;
  expiresAt: Date;
  verified: boolean;
  createdAt: Date;
}

const OtpTokenSchema = new Schema<IOtpToken>(
  {
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    otp: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    verified: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Auto-delete expired tokens
OtpTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const OtpToken: Model<IOtpToken> =
  (mongoose.models["OtpToken"] as Model<IOtpToken>) ??
  mongoose.model<IOtpToken>("OtpToken", OtpTokenSchema);
