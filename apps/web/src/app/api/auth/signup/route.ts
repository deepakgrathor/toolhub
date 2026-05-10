import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createHash } from "crypto";
import { connectDB, User, OtpToken, applyReferral } from "@toolhub/db";
import { generateReferralCode } from "@toolhub/shared";
import { z } from "zod";
import { FREE_CREDITS_ON_SIGNUP } from "@toolhub/shared";
import { createRateLimit } from "@/lib/rate-limit";

const signupLimiter = createRateLimit({ windowMs: 3_600_000, max: 5 });

const signupSchema = z.object({
  name: z.string().min(2).max(60).trim(),
  email: z.string().email().toLowerCase().trim(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72)
    .regex(/[A-Z]/, "Must contain an uppercase letter")
    .regex(/[a-z]/, "Must contain a lowercase letter")
    .regex(/[0-9]/, "Must contain a number")
    .regex(/[^A-Za-z0-9]/, "Must contain a special character"),
  otp: z.string().length(6, "OTP must be 6 digits").regex(/^\d{6}$/),
});

export async function POST(req: NextRequest) {
  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip") ??
      "unknown";
    const limit = signupLimiter(ip);
    if (!limit.allowed) {
      return NextResponse.json(
        { error: "Too many signup attempts. Try again later." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = signupSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { name, email, password, otp } = parsed.data;

    await connectDB();

    // Verify OTP — compare against stored hash
    const otpHash = createHash("sha256").update(otp).digest("hex");
    const token = await OtpToken.findOne({
      email,
      otp: otpHash,
      verified: false,
      expiresAt: { $gt: new Date() },
    });

    if (!token) {
      return NextResponse.json(
        { error: "Invalid or expired OTP. Please request a new one." },
        { status: 400 }
      );
    }

    // Check duplicate email
    const existing = await User.findOne({ email });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const hashed = await bcrypt.hash(password, 12);
    const referralCode = generateReferralCode();

    const [newUser] = await Promise.all([
      User.create({
        name,
        email,
        password: hashed,
        authProvider: "email",
        role: "user",
        credits: FREE_CREDITS_ON_SIGNUP,
        referralCode,
        lastSeen: new Date(),
      }),
      OtpToken.deleteMany({ email }),
    ]);

    // Apply referral bonus if ref cookie present
    const refCode = req.cookies.get("ref")?.value;
    if (refCode) {
      await applyReferral(newUser._id.toString(), refCode);
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    console.error("[signup]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
