import { Schema, Document, Model, getOrCreateModel } from "../lib/mongoose-shim";
import type { Types } from "mongoose";

export interface IToolOutput extends Document {
  userId: Types.ObjectId;
  toolSlug: string;
  inputSnapshot: Record<string, unknown>;
  outputText: string;
  creditsUsed: number;
  createdAt: Date;
  updatedAt: Date;
}

const ToolOutputSchema = new Schema<IToolOutput>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    toolSlug: { type: String, required: true, index: true },
    inputSnapshot: { type: Schema.Types.Mixed },
    outputText: { type: String, required: true },
    creditsUsed: { type: Number, required: true },
  },
  { timestamps: true }
);

export const ToolOutput: Model<IToolOutput> =
  getOrCreateModel<IToolOutput>("ToolOutput", ToolOutputSchema);
