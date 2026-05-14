import { Schema, Document, Model, getOrCreateModel } from "../lib/mongoose-shim";
import type { Types } from "mongoose";

export interface IPreset extends Document {
  userId: Types.ObjectId;
  toolSlug: string;
  name: string;
  inputs: Record<string, unknown>;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PresetSchema = new Schema<IPreset>(
  {
    userId:    { type: Schema.Types.ObjectId, ref: "User", required: true },
    toolSlug:  { type: String, required: true, trim: true },
    name:      { type: String, required: true, trim: true, maxlength: 50 },
    inputs:    { type: Schema.Types.Mixed, required: true },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

PresetSchema.index({ userId: 1, toolSlug: 1 });

export const Preset: Model<IPreset> = getOrCreateModel<IPreset>("Preset", PresetSchema);
