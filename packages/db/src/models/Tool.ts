import mongoose, { Schema, Document, Model } from "mongoose";

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
}

const ToolSchema = new Schema<ITool>(
  {
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    kits: [{ type: String, required: true }],
    isAI: { type: Boolean, default: false },
    isFree: { type: Boolean, default: false },
    icon: { type: String, default: "Wrench" },
  },
  { timestamps: true }
);

export const Tool: Model<ITool> =
  mongoose.models.Tool ?? mongoose.model<ITool>("Tool", ToolSchema);
