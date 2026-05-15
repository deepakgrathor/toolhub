import { NextRequest, NextResponse } from "next/server";
import { randomInt } from "crypto";
import { connectDB, OtpToken, User } from "@toolhub/db";
import { getRedis } from "@toolhub/shared";
import { hashOtp } from "@/lib/otp-utils";
import { z } from "zod";

const schema = z.object({
  email: z.string().email().toLowerCase().trim(),
  name: z.string().min(2).max(60).trim(),
});

function generateOtp(): string {
  return String(randomInt(100000, 1000000));
}

async function sendOtpEmail(email: string, name: string, otp: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL ?? "SetuLix <noreply@setulix.com>";

  if (!apiKey) {
    console.log(`\n[OTP] ${email} → ${otp}\n`);
    return;
  }

  const year = new Date().getFullYear();

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: email,
      subject: "Your SetuLix verification code",
      html: `
        <div style="font-family:Inter,sans-serif;max-width:480px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e4e4e7;">
          <div style="background:#7c3aed;padding:24px 32px;">
            <div style="display:flex;align-items:center;gap:8px;">
              <span style="font-size:20px;font-weight:800;color:#fff;">Setu<span style="color:#c4b5fd;">Lix</span></span>
            </div>
            <p style="color:#ede9fe;font-size:12px;margin:4px 0 0;">by SetuLabsAI</p>
          </div>
          <div style="padding:32px;">
            <h2 style="color:#09090b;margin:0 0 8px;font-size:20px;">Verify your email</h2>
            <p style="color:#71717a;margin:0 0 24px;">Hi ${name}, use the code below to complete your SetuLix sign-up.</p>
            <div style="background:#f4f4f5;border-radius:12px;padding:24px;text-align:center;font-family:monospace;letter-spacing:10px;font-size:36px;font-weight:700;color:#7c3aed;">
              ${otp}
            </div>
            <p style="color:#71717a;font-size:13px;margin-top:20px;">
              This code expires in <strong>10 minutes</strong>. Do not share it with anyone.
            </p>
          </div>
          <div style="border-top:1px solid #e4e4e7;padding:16px 32px;text-align:center;">
            <p style="color:#a1a1aa;font-size:11px;margin:0;">© ${year} SetuLabsAI · setulix.com</p>
          </div>
        </div>
      `,
    }),
  });
}

export async function POST(req: NextRequest) {
  // IP-based rate limiting: max 5 OTP requests per IP per hour
  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip") ??
      "unknown";

    const redis = getRedis();
    const rateLimitKey = `otp:rate:${ip}`;
    const attempts = await redis.incr(rateLimitKey);

    if (attempts === 1) {
      await redis.expire(rateLimitKey, 3600);
    }

    if (attempts > 5) {
      return NextResponse.json(
        { error: "Too many OTP requests. Please try again later." },
        { status: 429 }
      );
    }
  } catch (redisErr) {
    console.error("[send-otp] Redis rate-limit error (failing open):", redisErr);
  }

  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { email, name } = parsed.data;

    await connectDB();

    // Block if email already registered
    const existing = await User.findOne({ email }).select("_id").lean();
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    // Rate-limit: max 3 OTPs per email per 10 min
    const recentCount = await OtpToken.countDocuments({
      email,
      createdAt: { $gte: new Date(Date.now() - 10 * 60 * 1000) },
    });
    if (recentCount >= 3) {
      return NextResponse.json(
        { error: "Too many OTP requests. Please wait 10 minutes." },
        { status: 429 }
      );
    }

    const otp = generateOtp();
    const otpHash = hashOtp(otp);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Invalidate previous OTPs for this email
    await OtpToken.deleteMany({ email });

    await OtpToken.create({ email, otp: otpHash, expiresAt, verified: false });

    await sendOtpEmail(email, name, otp);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[send-otp]", err);
    return NextResponse.json({ error: "Failed to send OTP" }, { status: 500 });
  }
}
