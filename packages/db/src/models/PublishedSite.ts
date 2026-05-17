import { Schema, Document, Model, getOrCreateModel } from "../lib/mongoose-shim";
import type { Types } from "mongoose";

export interface IPublishedSite extends Document {
  userId: Types.ObjectId;
  siteSlug: string;
  siteUrl: string;
  r2Key: string;
  businessName: string;
  pageTitle: string;
  pages: number;
  creditsUsed: number;
  publishCreditsUsed: number;
  isActive: boolean;
  customDomain?: string;
  toolOutputId?: Types.ObjectId;
  publishedAt: Date;
  updatedAt: Date;
}

const PublishedSiteSchema = new Schema<IPublishedSite>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    siteSlug: { type: String, required: true, unique: true, index: true },
    siteUrl: { type: String, required: true },
    r2Key: { type: String, required: true },
    businessName: { type: String, default: "" },
    pageTitle: { type: String, default: "" },
    pages: { type: Number, default: 1 },
    creditsUsed: { type: Number, default: 0 },
    publishCreditsUsed: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true, index: true },
    customDomain: { type: String },
    toolOutputId: { type: Schema.Types.ObjectId, ref: "ToolOutput" },
    publishedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

PublishedSiteSchema.index({ userId: 1, isActive: 1 });

export const PublishedSite: Model<IPublishedSite> =
  getOrCreateModel<IPublishedSite>("PublishedSite", PublishedSiteSchema);
