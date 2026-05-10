import { Schema, Document, Model, getOrCreateModel } from "../lib/mongoose-shim";

export interface IOtpToken extends Document {
  // Legacy signup fields (keep for backward compat)
  email?: string;
  verified?: boolean;

  // Flexible identifier (mobile number for admin, email for signup)
  identifier?: string;
  type?: "admin_login" | "email_verify";

  // Common fields
  otp: string;
  expiresAt: Date;
  used: boolean;
  attempts: number;
  createdAt: Date;
}

const OtpTokenSchema = new Schema<IOtpToken>(
  {
    // Legacy email field (signup flow)
    email: { type: String, lowercase: true, trim: true, index: true },
    verified: { type: Boolean, default: false },

    // Flexible identifier (admin mobile login)
    identifier: { type: String, index: true },
    type: { type: String, enum: ["admin_login", "email_verify"] },

    // Common
    otp: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    used: { type: Boolean, default: false },
    attempts: { type: Number, default: 0 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Auto-delete expired tokens
OtpTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const OtpToken: Model<IOtpToken> = getOrCreateModel<IOtpToken>(
  "OtpToken",
  OtpTokenSchema
);
