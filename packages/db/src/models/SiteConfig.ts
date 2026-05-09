import { Schema, Document, Model, getOrCreateModel } from "../lib/mongoose-shim";

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

export const SiteConfig: Model<ISiteConfig> = getOrCreateModel<ISiteConfig>(
  "SiteConfig",
  SiteConfigSchema
);
