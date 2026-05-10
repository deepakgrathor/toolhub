import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB, OtpToken, User } from "@toolhub/db";
import { z } from "zod";

const schema = z.object({
  email: z.string().email().toLowerCase().trim(),
  password: z.string().min(1),
});

function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function sendAdminOtpEmail(email: string, name: string, otp: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL ?? "SetuLix <noreply@setulix.com>";

  if (!apiKey) {
    console.log(`\n[ADMIN OTP] ${email} → ${otp}\n`);
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
      subject: "SetuLix Admin — Login verification code",
      html: `
        <div style="font-family:Inter,sans-serif;max-width:480px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e4e4e7;">
          <div style="background:#7c3aed;padding:24px 32px;">
            <div style="display:flex;align-items:center;gap:8px;">
              <span style="font-size:20px;font-weight:800;color:#fff;">Setu<span style="color:#c4b5fd;">Lix</span></span>
            </div>
            <p style="color:#ede9fe;font-size:12px;margin:4px 0 0;">Admin Panel</p>
          </div>
          <div style="padding:32px;">
            <h2 style="color:#09090b;margin:0 0 8px;font-size:20px;">Admin login verification</h2>
            <p style="color:#71717a;margin:0 0 24px;">Hi ${name}, use the code below to complete your admin login. This code expires in 10 minutes.</p>
            <div style="background:#f4f4f5;border-radius:12px;padding:24px;text-align:center;font-family:monospace;letter-spacing:10px;font-size:36px;font-weight:700;color:#7c3aed;">
              ${otp}
            </div>
            <p style="color:#71717a;font-size:13px;margin-top:20px;">
              If you did not attempt to log in, please ignore this email and secure your account.
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
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;

    await connectDB();

    const user = await User.findOne({ email }).select("+password");

    // Return generic error to prevent user enumeration
    if (!user || !user.password) {
      return NextResponse.json(
        { error: "Invalid credentials or not an admin account" },
        { status: 401 }
      );
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return NextResponse.json(
        { error: "Invalid credentials or not an admin account" },
        { status: 401 }
      );
    }

    if (user.role !== "admin") {
      return NextResponse.json(
        { error: "Invalid credentials or not an admin account" },
        { status: 403 }
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
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await OtpToken.deleteMany({ email });
    await OtpToken.create({ email, otp, expiresAt, verified: false });

    await sendAdminOtpEmail(email, user.name ?? "Admin", otp);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[admin/auth/send-otp]", err);
    return NextResponse.json({ error: "Failed to send OTP" }, { status: 500 });
  }
}
