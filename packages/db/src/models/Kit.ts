import { Schema, Document, Model, getOrCreateModel } from "../lib/mongoose-shim";

export interface IKit extends Document {
  slug: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  order: number;
  isActive: boolean;
  showInOnboarding: boolean;
  onboardingLabel: string;
  onboardingDescription: string;
  onboardingIcon: string;
  createdAt: Date;
  updatedAt: Date;
}

const KitSchema = new Schema<IKit>(
  {
    slug:        { type: String, required: true, unique: true, trim: true, lowercase: true },
    name:        { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    icon:        { type: String, default: "LayoutGrid" },
    color:       { type: String, default: "#7c3aed" },
    order:       { type: Number, default: 0 },
    isActive:    { type: Boolean, default: true },

    showInOnboarding:     { type: Boolean, default: true },
    onboardingLabel:      { type: String, default: "" },
    onboardingDescription:{ type: String, default: "" },
    onboardingIcon:       { type: String, default: "LayoutGrid" },
  },
  { timestamps: true }
);

export const Kit: Model<IKit> = getOrCreateModel<IKit>("Kit", KitSchema);
