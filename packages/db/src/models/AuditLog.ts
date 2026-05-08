import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IAuditLog extends Document {
  adminId: Types.ObjectId;
  action: string;
  target: string;
  before: unknown;
  after: unknown;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    adminId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    action: { type: String, required: true, trim: true },
    target: { type: String, required: true, trim: true },
    before: { type: Schema.Types.Mixed },
    after: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const AuditLog: Model<IAuditLog> =
  mongoose.models.AuditLog ??
  mongoose.model<IAuditLog>("AuditLog", AuditLogSchema);
