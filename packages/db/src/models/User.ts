import { Schema, Document, Model, getOrCreateModel } from "../lib/mongoose-shim";
import type { Types } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  image?: string;
  mobile?: string | null;
  role: "user" | "admin";
  // Credit buckets (replaces single `credits` field)
  purchasedCredits: number;
  subscriptionCredits: number;
  rolloverCredits: number;
  // Rollover tracking
  rolloverExpiresAt?: Date | null;
  lastRolloverAt?: Date | null;
  // Virtual — sum of all 3 buckets (read-only)
  credits: number;
  plan: "free" | "lite" | "pro" | "business" | "enterprise";
  kitPreference?: string;
  authProvider: "google" | "email";
  referralCode?: string;
  referredBy?: Types.ObjectId | null;
  referralCount: number;
  isBanned: boolean;
  status: "active" | "deleted" | "banned";
  isDeleted: boolean;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  lastSeen: Date;
  // Onboarding
  onboardingCompleted: boolean;
  onboardingStep: number;
  // Personal profile
  avatar?: string | null;
  address?: string | null;
  profession?: "creator" | "sme" | "hr" | "legal" | "marketer" | "other" | null;
  professions?: string[];
  // Workspace
  kitName?: string | null;
  selectedTools: string[];
  // Profile completion
  profileScore: number;
  // Referral
  welcomeCreditGiven: boolean;
  // Plan expiry
  planExpiry?: Date | null;
  renewalReminderSent?: boolean;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, select: false },
    image: { type: String },
    mobile: { type: String, sparse: true, unique: true },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    // Credit buckets (replaces single credits field)
    purchasedCredits:    { type: Number, default: 0, min: 0 },
    subscriptionCredits: { type: Number, default: 0, min: 0 },
    rolloverCredits:     { type: Number, default: 0, min: 0 },
    // Rollover tracking
    rolloverExpiresAt:   { type: Date, default: null },
    lastRolloverAt:      { type: Date, default: null },
    plan: {
      type: String,
      enum: ["free", "lite", "pro", "business", "enterprise"],
      default: "free",
    },
    kitPreference: { type: String },
    // Onboarding
    onboardingCompleted: { type: Boolean, default: false },
    onboardingStep: { type: Number, default: 1 },
    // Personal profile
    avatar: { type: String, default: null },
    address: { type: String, default: null },
    profession: {
      type: String,
      enum: ["creator", "sme", "hr", "legal", "marketer", "other", null],
      default: null,
    },
    professions: {
      type: [String],
      enum: ["creator", "sme", "hr", "legal", "marketer", "other"],
      default: [],
    },
    // Workspace
    kitName: { type: String, default: null },
    selectedTools: { type: [String], default: [] },
    // Profile completion
    profileScore: { type: Number, default: 0 },
    // Referral
    welcomeCreditGiven: { type: Boolean, default: false },
    authProvider: {
      type: String,
      enum: ["google", "email"],
      default: "email",
    },
    referralCode: { type: String, unique: true, sparse: true },
    referredBy: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
    referralCount: { type: Number, default: 0 },
    isBanned: { type: Boolean, default: false },
    status: { type: String, enum: ["active", "deleted", "banned"], default: "active" },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
    lastSeen: { type: Date, default: Date.now },
    // Plan expiry
    planExpiry: { type: Date, default: null },
    renewalReminderSent: { type: Boolean, default: false },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// Virtual — returns total credit balance (sum of all 3 buckets).
// Read-only: writes must target the 3 bucket fields explicitly.
UserSchema.virtual("credits").get(function () {
  return (
    (this.purchasedCredits ?? 0) +
    (this.subscriptionCredits ?? 0) +
    (this.rolloverCredits ?? 0)
  );
});

export const User: Model<IUser> = getOrCreateModel<IUser>("User", UserSchema);
