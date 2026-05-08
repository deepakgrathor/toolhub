import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB, User } from "@toolhub/db";
import { z } from "zod";
import { FREE_CREDITS_ON_SIGNUP } from "@toolhub/shared";

const signupSchema = z.object({
  name: z.string().min(2).max(60).trim(),
  email: z.string().email().toLowerCase(),
  password: z.string().min(8).max(72),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = signupSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { name, email, password } = parsed.data;

    await connectDB();

    const existing = await User.findOne({ email });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const hashed = await bcrypt.hash(password, 12);

    await User.create({
      name,
      email,
      password: hashed,
      authProvider: "email",
      role: "user",
      credits: FREE_CREDITS_ON_SIGNUP,
      lastSeen: new Date(),
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    console.error("[signup]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
