import { NextRequest, NextResponse } from "next/server";
import { connectDB, OtpToken } from "@toolhub/db";
import { getRedis } from "@toolhub/shared";
import { z } from "zod";
import { randomUUID } from "crypto";

const schema = z.object({
  email: z.string().email().toLowerCase().trim(),
  otp: z.string().length(6).regex(/^\d{6}$/),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid OTP format" },
        { status: 400 }
      );
    }

    const { email, otp } = parsed.data;

    await connectDB();

    const token = await OtpToken.findOne({
      email,
      otp,
      verified: false,
      expiresAt: { $gt: new Date() },
    });

    if (!token) {
      return NextResponse.json(
        { error: "Invalid or expired OTP. Please request a new one." },
        { status: 400 }
      );
    }

    await OtpToken.deleteMany({ email });

    // Generate a short-lived admin token for signIn
    const adminToken = randomUUID();
    const redis = getRedis();
    // Store email → adminToken for 5 minutes (one-time use)
    await redis.set(`setulix:admin:login:${adminToken}`, email, { ex: 300 });

    return NextResponse.json({ success: true, adminToken });
  } catch (err) {
    console.error("[admin/auth/verify-otp]", err);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
