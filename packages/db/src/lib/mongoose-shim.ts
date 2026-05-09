/**
 * Normalised mongoose import.
 *
 * When Next.js bundles @toolhub/db via transpilePackages, webpack wraps the
 * CJS mongoose module in an ES Module namespace object:
 *   { default: <actual mongoose instance>, ... }
 *
 * So `import mongoose from "mongoose"` inside a bundled file may give us the
 * namespace object rather than the mongoose instance, causing
 * `mongoose.models` to be `undefined`.
 *
 * This shim resolves the real instance from either shape and re-exports it so
 * every model file gets a consistent reference.
 */
import _mongoose from "mongoose";

// Handle both:
//   CJS direct:  _mongoose IS the mongoose instance  → .connect, .models exist
//   ESM wrapped: _mongoose = { default: instance }   → use .default
const mongoose =
  (_mongoose as unknown as { default: typeof _mongoose }).default ?? _mongoose;

export default mongoose;

// Re-export type helpers so model files don't need two imports
export type { Model, Document, Schema, Types, Connection } from "mongoose";
export { Schema } from "mongoose";
