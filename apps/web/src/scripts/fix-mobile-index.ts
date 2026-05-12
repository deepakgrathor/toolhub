/**
 * Fix mobile_1 sparse index + clean up existing mobile: null documents.
 *
 * Root cause: sparse indexes skip absent fields, NOT explicit null values.
 * Schema had `default: null`, so every user without a mobile got { mobile: null }
 * inserted — still indexed, still collides.
 *
 * This script:
 *   1. Unsets mobile on all documents where it is null (removes the field entirely)
 *   2. Drops the mobile_1 index
 *   3. Recreates it as { unique: true, sparse: true }
 *
 * Run: MONGODB_URI="..." npx tsx apps/web/src/scripts/fix-mobile-index.ts
 */

import mongoose from "mongoose";

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI not set");
  process.exit(1);
}

async function fix() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(uri!);
  console.log("Connected.\n");

  const db = mongoose.connection.db;
  if (!db) throw new Error("No DB connection");

  const collection = db.collection("users");

  // ── Step 1: Unset mobile field where it is explicitly null ────────────────
  const result = await collection.updateMany(
    { mobile: null },
    { $unset: { mobile: "" } }
  );
  console.log(`Step 1: Unset mobile: null on ${result.modifiedCount} document(s).`);

  // ── Step 2: Drop existing mobile_1 index ──────────────────────────────────
  const indexes = await collection.indexes();
  const hasMobileIndex = indexes.some((idx) => idx.name === "mobile_1");
  if (hasMobileIndex) {
    await collection.dropIndex("mobile_1");
    console.log("Step 2: Dropped index mobile_1.");
  } else {
    console.log("Step 2: mobile_1 not found, skipping drop.");
  }

  // ── Step 3: Recreate as sparse unique ─────────────────────────────────────
  await collection.createIndex(
    { mobile: 1 },
    { unique: true, sparse: true, name: "mobile_1" }
  );
  console.log("Step 3: Recreated mobile_1 with { unique: true, sparse: true }.");

  // ── Verify ─────────────────────────────────────────────────────────────────
  const after = await collection.indexes();
  const newIdx = after.find((idx) => idx.name === "mobile_1");
  console.log("\nVerified:", JSON.stringify(newIdx));

  // $type: 10 = BSON Null — only matches explicit null, not absent fields
  const remaining = await collection.countDocuments({ mobile: { $type: 10 } });
  console.log(`Remaining explicit mobile: null documents: ${remaining} (should be 0)`);

  console.log("\nDone.");
  await mongoose.disconnect();
}

fix().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
