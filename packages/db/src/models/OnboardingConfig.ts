import { Schema, Document, Model, getOrCreateModel } from "../lib/mongoose-shim";

export interface IOnboardingOption {
  value: string;
  label: string;
  icon: string;
  subtitle?: string;
  kitName?: string;
}

export interface IOnboardingConfig extends Document {
  step: number;
  question: string;
  subtitle?: string;
  type: "single_select" | "text" | "multi_select";
  field: string;
  options: IOnboardingOption[];
  isActive: boolean;
  order: number;
}

const OnboardingOptionSchema = new Schema<IOnboardingOption>(
  {
    value: { type: String, required: true },
    label: { type: String, required: true },
    icon: { type: String, required: true },
    subtitle: { type: String },
    kitName: { type: String },
  },
  { _id: false }
);

const OnboardingConfigSchema = new Schema<IOnboardingConfig>(
  {
    step: { type: Number, required: true },
    question: { type: String, required: true },
    subtitle: { type: String },
    type: {
      type: String,
      enum: ["single_select", "text", "multi_select"],
      required: true,
    },
    field: { type: String, required: true },
    options: [OnboardingOptionSchema],
    isActive: { type: Boolean, default: true },
    order: { type: Number, required: true },
  },
  { timestamps: true }
);

export const OnboardingConfig: Model<IOnboardingConfig> =
  getOrCreateModel<IOnboardingConfig>("OnboardingConfig", OnboardingConfigSchema);
