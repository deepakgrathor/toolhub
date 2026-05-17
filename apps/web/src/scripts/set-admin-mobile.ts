// /**
//  * One-time script: Set mobile number for the admin user in MongoDB.
//  *
//  * Usage:
//  *   MONGODB_URI="mongodb+srv://..." ADMIN_MOBILE="917723970629" npx tsx apps/web/src/scripts/set-admin-mobile.ts
//  *
//  * ADMIN_MOBILE format: country code + number, no spaces or +
//  *   India (+91): 91XXXXXXXXXX  e.g. 917723970629
//  */

// import mongoose from "mongoose";

// async function main() {
//   const uri = process.env.MONGODB_URI;
//   if (!uri) {
//     console.error("Error: MONGODB_URI env var is required");
//     process.exit(1);
//   }

//   const mobile = process.env.ADMIN_MOBILE;
//   if (!mobile) {
//     console.error("Error: ADMIN_MOBILE env var is required (e.g. 917723970629)");
//     process.exit(1);
//   }

//   await mongoose.connect(uri);
//   console.log("Connected to MongoDB");

//   const result = await mongoose.connection.db!
//     .collection("users")
//     .findOneAndUpdate(
//       { role: "admin" },
//       {
//         $set: {
//           mobile,
//           updatedAt: new Date(),
//         },
//       },
//       { returnDocument: "after" }
//     );

//   if (!result) {
//     console.error("No admin user found. Run make-admin.ts first.");
//     process.exit(1);
//   }

//   console.log(`✓ Admin mobile set: ${mobile}`);
//   console.log(`  User: ${result.email} (${result.name})`);
//   process.exit(0);
// }

// main().catch((err) => {
//   console.error("Script failed:", err);
//   process.exit(1);
// });
