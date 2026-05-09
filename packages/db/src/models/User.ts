import { Schema, Document, Model, getOrCreateModel } from "../lib/mongoose-shim";
import type { Types } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  image?: string;
  role: "user" | "admin";
  credits: number;
  plan: "free" | "pro" | "enterprise";
  kitPreference?: string;
  authProvider: "google" | "email";
  referralCode?: string;
  referredBy?: Types.ObjectId | null;
  referralCount: number;
  isBanned: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastSeen: Date;
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
    role: { type: String, enum: ["user", "admin"], default: "user" },
    credits: { type: Number, default: 0, min: 0 },
    plan: {
      type: String,
      enum: ["free", "pro", "enterprise"],
      default: "free",
    },
    kitPreference: { type: String },
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
