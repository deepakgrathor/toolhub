// /**
//  * Feat-9A: Migrate single `credits` field → 3 credit buckets.
//  *
//  * Safe to run multiple times (idempotent).
//  * Run AFTER deploying the new User schema.
//  *
//  * Usage:
//  *   MONGODB_URI="mongodb+srv://..." npx tsx apps/web/src/scripts/migrate-credits.ts
//  */
// import mongoose from "mongoose";

// const uri = process.env.MONGODB_URI;
// if (!uri) {
//   console.error("MONGODB_URI not set");
//   process.exit(1);
// }

// async function migrate() {
//   await mongoose.connect(uri!);
//   console.log("Connected to MongoDB.\n");

//   // Step 1 — move old credits → subscriptionCredits for users who haven't been migrated yet.
//   // Idempotent: only touches users where all 3 buckets are still 0 but old credits > 0.
//   const result = await mongoose.connection.collection("users").updateMany(
//     {
//       credits: { $exists: true, $gt: 0 },
//       subscriptionCredits: { $in: [null, 0] },
//       purchasedCredits:    { $in: [null, 0] },
//       rolloverCredits:     { $in: [null, 0] },
//     },
//     [
//       {
//         $set: {
//           subscriptionCredits: "$credits",
//           purchasedCredits:    0,
//           rolloverCredits:     0,
//           rolloverExpiresAt:   null,
//           lastRolloverAt:      null,
//         },
//       },
//     ]
//   );
//   console.log(`Migrated ${result.modifiedCount} users (credits → subscriptionCredits)`);

//   // Step 2 — initialise bucket fields for users who never had any credits.
//   const result2 = await mongoose.connection.collection("users").updateMany(
//     { subscriptionCredits: { $exists: false } },
//     {
//       $set: {
//         subscriptionCredits: 0,
//         purchasedCredits:    0,
//         rolloverCredits:     0,
//         rolloverExpiresAt:   null,
//         lastRolloverAt:      null,
//       },
//     }
//   );
//   console.log(`Initialised ${result2.modifiedCount} users with 0-credit buckets`);

//   console.log("\nMigration complete ✓");
//   await mongoose.disconnect();
// }

// migrate().catch((err) => {
//   console.error("Migration failed:", err);
//   process.exit(1);
// });
