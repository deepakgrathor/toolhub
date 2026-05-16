import mongoose, { Schema, Document, Model, getOrCreateModel } from "../lib/mongoose-shim";
import type { Types } from "mongoose";

export interface IFormField {
  key: string;
  label: string;
  type: "text" | "textarea" | "select" | "number" | "file";
  placeholder?: string;
  required: boolean;
  options?: string[];
  defaultValue?: string;
  maxLength?: number;
  helpText?: string;
  order: number;
}

export interface ITool extends Document {
  slug: string;
  name: string;
  description: string;
  category: string;
  kits: string[];
  isAI: boolean;
  isFree: boolean;
  icon: string;
  createdAt: Date;
  updatedAt: Date;

  // Tool type
  type: "ai" | "client-side";

  // Kit reference
  kitSlug: string;
  kitRef: Types.ObjectId | null;

  // AI configuration
  aiModel: "claude-haiku-3-5" | "claude-sonnet-4-5" | "gpt-4o-mini" | "gpt-4o" | "gemini-flash-2.0" | "gpt-image-1";
  systemPrompt: string;
  promptTemplate: string;
  formFields: IFormField[];

  // Output configuration
  outputType: "text" | "html" | "image" | "json";
  outputLabel: string;

  // UI configuration
  color: string;
  tags: string[];

  // AI limits
  maxOutputTokens: number;
  temperature: number;

  // Abuse protection
  dailyLimit: number;

  // Access control
  requiredPlan: "free" | "lite" | "pro" | "business" | "enterprise";
}

const FormFieldSchema = new Schema<IFormField>(
  {
    key:          { type: String, required: true },
    label:        { type: String, required: true },
    type:         { type: String, enum: ["text", "textarea", "select", "number", "file"], default: "text" },
    placeholder:  { type: String, default: "" },
    required:     { type: Boolean, default: true },
    options:      [{ type: String }],
    defaultValue: { type: String, default: "" },
    maxLength:    { type: Number },
    helpText:     { type: String, default: "" },
    order:        { type: Number, default: 0 },
  },
  { _id: false }
);

const ToolSchema = new Schema<ITool>(
  {
    // ── Existing fields (untouched) ────────────────────────────────────────────
    slug:        { type: String, required: true, unique: true, trim: true, lowercase: true },
    name:        { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    category:    { type: String, required: true, trim: true },
    kits:        [{ type: String, required: true }],
    isAI:        { type: Boolean, default: false },
    isFree:      { type: Boolean, default: false },
    icon:        { type: String, default: "Wrench" },

    // ── New fields ─────────────────────────────────────────────────────────────
    type: {
      type: String,
      enum: ["ai", "client-side"],
      default: "ai",
    },

    kitSlug: { type: String, default: "" },
    kitRef:  { type: mongoose.Schema.Types.ObjectId, ref: "Kit", default: null },

    aiModel: {
      type: String,
      enum: ["claude-haiku-3-5", "claude-sonnet-4-5", "gpt-4o-mini", "gpt-4o", "gemini-flash-2.0", "gpt-image-1"],
      default: "gemini-flash-2.0",
    },
    systemPrompt:   { type: String, default: "" },
    promptTemplate: { type: String, default: "" },
    formFields:     { type: [FormFieldSchema], default: [] },

    outputType:  { type: String, enum: ["text", "html", "image", "json"], default: "text" },
    outputLabel: { type: String, default: "Generated Output" },

    color: { type: String, default: "#7c3aed" },
    tags:  [{ type: String }],

    maxOutputTokens: { type: Number, default: 2000 },
    temperature:     { type: Number, default: 0.7 },
    dailyLimit:      { type: Number, default: 0 },

    requiredPlan: {
      type: String,
      enum: ["free", "lite", "pro", "business", "enterprise"],
      default: "free",
    },
  },
  { timestamps: true }
);

export const Tool: Model<ITool> = getOrCreateModel<ITool>("Tool", ToolSchema);
