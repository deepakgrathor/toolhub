import { Schema, Document, Model, getOrCreateModel } from "../lib/mongoose-shim";
import type { Types } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  image?: string;
  mobile?: string | null;
  role: "user" | "admin";
  credits: number;
  plan: "free" | "lite" | "pro" | "business" | "enterprise";
  kitPreference?: string;
  authProvider: "google" | "email";
  referralCode?: string;
  referredBy?: Types.ObjectId | null;
  referralCount: number;
  isBanned: boolean;
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
    credits: { type: Number, default: 0, min: 0 },
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
    selectedTools: [{ type: String }],
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
    referredBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    referralCount: { type: Number, default: 0 },
    isBanned: { type: Boolean, default: false },
    lastSeen: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const User: Model<IUser> = getOrCreateModel<IUser>("User", UserSchema);
