#!/usr/bin/env tsx
import { connectDB, User } from "./index";

async function makeAdmin(email: string) {
  await connectDB();
  const user = await User.findOneAndUpdate(
    { email },
    { role: "admin" },
    { new: true }
  );
  if (!user) {
    console.error("User not found:", email);
    process.exit(1);
  }
  console.log("Admin role set for:", user.email);
  process.exit(0);
}

const email = process.argv[2];
if (!email) {
  console.error("Usage: tsx src/make-admin.ts your@email.com");
  process.exit(1);
}
makeAdmin(email);
