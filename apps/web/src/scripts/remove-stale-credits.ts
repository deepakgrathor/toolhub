/**
 * One-time cleanup: removes the stale `credits` MongoDB field from all users.
 *
 * Run ONLY after:
 *   1. Feat-9A (3-bucket split) is deployed and verified working
 *   2. Feat-9B (rollover overhaul) is deployed and tested
 *
 * Safe to run multiple times (updateMany is idempotent for $unset).
 *
 * Usage: npx ts-node -r tsconfig-paths/register src/scripts/remove-stale-credits.ts
 */

import mongoose from "mongoose";

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI not set");
  process.exit(1);
}

async function cleanup() {
  await mongoose.connect(uri!);
  console.log("Connected.\n");

  const result = await mongoose.connection
    .collection("users")
    .updateMany(
      { credits: { $exists: true } },
      { $unset: { credits: "" } }
    );

  console.log(`Removed stale credits field from ${result.modifiedCount} users`);
  console.log("Cleanup complete.");
  await mongoose.disconnect();
}

cleanup().catch((err) => {
  console.error("Cleanup failed:", err);
  process.exit(1);
});
