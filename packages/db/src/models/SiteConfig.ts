import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISiteConfig extends Document {
  key: string;
  value: unknown;
  updatedAt: Date;
}

const SiteConfigSchema = new Schema<ISiteConfig>(
  {
    key: { type: String, required: true, unique: true, trim: true },
    value: { type: Schema.Types.Mixed, required: true },
  },
  { timestamps: true }
);

export const SiteConfig: Model<ISiteConfig> =
  mongoose.models.SiteConfig ??
  mongoose.model<ISiteConfig>("SiteConfig", SiteConfigSchema);
