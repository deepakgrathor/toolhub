import { Schema, Document, Model, getOrCreateModel } from "../lib/mongoose-shim";

export interface IToolConfig extends Document {
  toolSlug: string;
  creditCost: number;
  isActive: boolean;
  isVisible: boolean;
  aiModel: string;
  aiProvider: string;
  fallbackModel: string;
  fallbackProvider: string;
  updatedAt: Date;
}

const ToolConfigSchema = new Schema<IToolConfig>(
  {
    toolSlug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    creditCost: { type: Number, required: true, min: 0, default: 0 },
    isActive: { type: Boolean, default: true },
    isVisible: { type: Boolean, default: true },
    aiModel: { type: String, default: "" },
    aiProvider: { type: String, default: "" },
    fallbackModel: { type: String, default: "" },
    fallbackProvider: { type: String, default: "" },
  },
  { timestamps: true }
);

export const ToolConfig: Model<IToolConfig> = getOrCreateModel<IToolConfig>(
  "ToolConfig",
  ToolConfigSchema
);
