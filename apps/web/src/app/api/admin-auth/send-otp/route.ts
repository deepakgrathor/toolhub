import { NextRequest, NextResponse } from "next/server";
import { randomInt } from "crypto";
import { connectDB, OtpToken, User } from "@toolhub/db";
import { sendOtpSMS } from "@/lib/sms";
import { rateLimit } from "@/lib/rate-limit";
import { hashOtp } from "@/lib/otp-utils";
import { z } from "zod";

const schema = z.object({
  mobile: z.string().min(10).max(15).regex(/^\d+$/),
});

function generateOtp(): string {
  return String(randomInt(100000, 1000000));
}

export async function POST(req: NextRequest) {
  try {
    // IP rate limit — blocks spray attacks from same IP across different mobiles
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip") ??
      "unknown";
    const ipCheck = await rateLimit(ip, 5, 15 * 60);
    if (!ipCheck.success) {
      return NextResponse.json(
        { error: "Too many attempts. Try again later." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid mobile number" }, { status: 400 });
    }

    const { mobile } = parsed.data;

    await connectDB();

    // Verify admin exists with this mobile
    const user = await User.findOne({ mobile, role: "admin" });
    if (!user) {
      // Generic error — don't reveal if number exists
      return NextResponse.json({ error: "Invalid mobile number" }, { status: 401 });
    }

    // Rate limit: max 3 OTPs per mobile per 15 min
    const recentCount = await OtpToken.countDocuments({
      identifier: mobile,
      type: "admin_login",
      createdAt: { $gte: new Date(Date.now() - 15 * 60 * 1000) },
    });
    if (recentCount >= 3) {
      return NextResponse.json(
        { error: "Too many attempts. Wait 15 minutes." },
        { status: 429 }
      );
    }

    const otp = generateOtp();
    const otpHash = hashOtp(otp);

    // Delete any existing unused OTPs for this mobile
    await OtpToken.deleteMany({ identifier: mobile, type: "admin_login" });

    await OtpToken.create({
      identifier: mobile,
      type: "admin_login",
      otp: otpHash,        // store hash, never plaintext
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      used: false,
      attempts: 0,
    });

    const sent = await sendOtpSMS(mobile, otp);
    if (!sent) {
      return NextResponse.json(
        { error: "Failed to send OTP. Please try again." },
        { status: 500 }
      );
    }

    // Mask mobile: 91XXXXX6789
    const masked =
      mobile.slice(0, 4) +
      "X".repeat(Math.max(0, mobile.length - 7)) +
      mobile.slice(-3);

    return NextResponse.json({ success: true, maskedMobile: masked });
  } catch (err) {
    console.error("[admin-auth/send-otp]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
