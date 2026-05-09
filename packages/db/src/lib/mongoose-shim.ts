/**
 * Normalised mongoose import + safe model registration helper.
 *
 * Problem: when Next.js bundles @toolhub/db via transpilePackages, webpack
 * may wrap the CJS mongoose export in an ESM namespace { default: instance }.
 * In that shape, mongoose.models is undefined, and accessing .models["X"]
 * throws immediately — the ?? fallback never runs.
 *
 * Fix (two layers):
 * 1. Normalise the import so `mongoose` is always the real instance.
 * 2. Use getOrCreateModel() which calls mongoose.model() via try/catch,
 *    completely avoiding mongoose.models property access.
 */
import _mongoose from "mongoose";
import { Schema, type Model, type Document } from "mongoose";

// Handle both shapes:
//   Direct CJS:   _mongoose IS the instance  → .connect, .model, .models exist
//   ESM-wrapped:  _mongoose = { default: instance } → need .default
const mongoose =
  (_mongoose as unknown as { default: typeof _mongoose }).default ?? _mongoose;

export default mongoose;

// Re-export value + type helpers so model files don't need two imports.
export { Schema };
export type { Model, Document, Types, Connection } from "mongoose";

/**
 * Gets an already-registered model by name, or registers it with the
 * provided schema if it doesn't exist yet.
 *
 * This avoids mongoose.models["X"] entirely — that property can be
 * undefined in certain webpack bundling scenarios and throws before the
 * ?? fallback can run.
 */
export function getOrCreateModel<T extends Document>(
  name: string,
  schema: Schema<T>
): Model<T> {
  try {
    // Returns existing model; throws OverwriteModelError / MissingSchemaError
    // if the model has not been registered yet.
    return mongoose.model<T>(name);
  } catch {
    return mongoose.model<T>(name, schema);
  }
}
