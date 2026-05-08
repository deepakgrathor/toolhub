import { NextRequest, NextResponse } from "next/server";
import { connectDB, OtpToken, User } from "@toolhub/db";
import { z } from "zod";

const schema = z.object({
  email: z.string().email().toLowerCase().trim(),
  name: z.string().min(2).max(60).trim(),
});

function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function sendOtpEmail(email: string, name: string, otp: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL ?? "noreply@toolspire.io";

  if (!apiKey) {
    // Dev fallback — print to server console
    console.log(`\n[OTP] ${email} → ${otp}\n`);
    return;
  }

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: email,
      subject: "Your Toolspire verification code",
      html: `
        <div style="font-family:Inter,sans-serif;max-width:480px;margin:0 auto;padding:32px;">
          <h2 style="color:#7c3aed;margin-bottom:8px;">Verify your email</h2>
          <p style="color:#555;margin-bottom:24px;">Hi ${name}, use the code below to verify your Toolspire account.</p>
          <div style="background:#f4f4f5;border-radius:12px;padding:24px;text-align:center;letter-spacing:8px;font-size:32px;font-weight:700;color:#09090b;">
            ${otp}
          </div>
          <p style="color:#888;font-size:12px;margin-top:16px;">This code expires in 10 minutes. Do not share it with anyone.</p>
        </div>
      `,
    }),
  });
}

export async function POST(req: NextRequest) {
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
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    // Invalidate previous OTPs for this email
    await OtpToken.deleteMany({ email });

    await OtpToken.create({ email, otp, expiresAt, verified: false });

    await sendOtpEmail(email, name, otp);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[send-otp]", err);
    return NextResponse.json({ error: "Failed to send OTP" }, { status: 500 });
  }
}
