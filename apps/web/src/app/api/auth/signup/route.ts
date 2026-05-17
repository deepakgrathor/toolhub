import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB, User, OtpToken, Referral, CreditService } from "@toolhub/db";
import { invalidateBalance } from "@/lib/credit-cache";
import { generateReferralCode } from "@toolhub/shared";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";
import { hashOtp } from "@/lib/otp-utils";
import { getSiteConfigValue } from "@/lib/site-config-cache";

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
    const limit = await rateLimit(ip, 5, 3600);
    if (!limit.success) {
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

    // Verify OTP — compare against stored HMAC hash
    const otpHash = hashOtp(otp);
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
        credits: 0,
        referralCode,
        lastSeen: new Date(),
      }),
      OtpToken.deleteMany({ email }),
    ]);

    // Handle referral cookie — create pending Referral doc (credits release on onboarding complete)
    const refCode = req.cookies.get("ref")?.value;
    if (refCode) {
      await createPendingReferral(newUser._id.toString(), refCode, ip);
    }

    // Welcome credits for direct (non-referred) email signups
    if (!refCode) {
      try {
        const welcomeCredits = await getSiteConfigValue('welcome_bonus_credits', 10) as number;

        if (welcomeCredits > 0) {
          await User.findByIdAndUpdate(newUser._id, { welcomeCreditGiven: true });
          await CreditService.addCredits(newUser._id.toString(), welcomeCredits, "welcome_bonus");
          await invalidateBalance(newUser._id.toString());
        }
      } catch (err) {
        // Silent fail — never break signup on credit error
        console.error("[signup/welcome-credits]", err);
      }
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    console.error("[signup]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

async function createPendingReferral(
  newUserId: string,
  refCode: string,
  signupIP: string
): Promise<void> {
  try {
    const referrer = await User.findOne({ referralCode: refCode }).select("_id referralCode");
    if (!referrer) return;

    // Self-referral block
    if (referrer._id.toString() === newUserId) return;

    // Anti-spam: 5+ signups from same IP in last hour → suspicious
    const oneHourAgo = new Date(Date.now() - 3_600_000);
    const recentFromIP = await Referral.countDocuments({
      refCode,
      signupIP,
      createdAt: { $gte: oneHourAgo },
    });

    const isSuspicious = recentFromIP >= 4; // this new one will be the 5th+

    await User.findByIdAndUpdate(newUserId, { referredBy: referrer._id });

    await Referral.create({
      referrerId: referrer._id,
      referredId: newUserId,
      refCode,
      status: isSuspicious ? "suspicious" : "pending",
      signupIP,
    });
  } catch (err) {
    // Silent fail — never break signup on referral error
    console.error("[createPendingReferral]", err);
  }
}
