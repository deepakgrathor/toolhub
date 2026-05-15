import { NextRequest, NextResponse } from "next/server";
import { connectDB, OtpToken, User, AuditLog } from "@toolhub/db";
import { verifyOtp } from "@/lib/otp-utils";
import { createAdminToken } from "@/lib/admin-auth";
import { z } from "zod";

const schema = z.object({
  mobile: z.string().min(10).max(15).regex(/^\d+$/),
  otp: z
    .string()
    .length(6)
    .regex(/^\d{6}$/),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Mobile and valid 6-digit OTP required" },
        { status: 400 },
      );
    }

    const { mobile, otp } = parsed.data;

    await connectDB();

    // Find latest valid OTP record
    const otpRecord = await OtpToken.findOne({
      identifier: mobile,
      type: "admin_login",
      used: false,
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    if (!otpRecord) {
      return NextResponse.json(
        { error: "OTP expired. Request a new one." },
        { status: 401 },
      );
    }

    // Lockout after 5 wrong attempts
    if (otpRecord.attempts >= 5) {
      await OtpToken.deleteOne({ _id: otpRecord._id });
      return NextResponse.json(
        { error: "Too many wrong attempts. Request a new OTP." },
        { status: 401 },
      );
    }

    // Check OTP — HMAC-SHA256 + timing-safe comparison
    if (!verifyOtp(otp, otpRecord.otp)) {
      await OtpToken.updateOne(
        { _id: otpRecord._id },
        { $inc: { attempts: 1 } },
      );
      const remaining = 4 - (otpRecord.attempts ?? 0);
      return NextResponse.json(
        {
          error: `Wrong OTP. ${remaining} attempt${remaining === 1 ? "" : "s"} left.`,
        },
        { status: 401 },
      );
    }

    // Mark used
    await OtpToken.updateOne({ _id: otpRecord._id }, { used: true });
    // Get admin user — must be active and not banned
    const user = await User.findOne({ mobile, role: "admin", isBanned: false });
    if (!user) {
      return NextResponse.json({ error: "Access denied" }, { status: 401 });
    }

    await User.findByIdAndUpdate(user._id, { lastSeen: new Date() });

    // Create signed admin JWT
    const token = await createAdminToken({
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
    });

    // Audit log
    try {
      await AuditLog.create({
        adminId: user._id,
        action: "admin_login",
        target: `mobile:${mobile.slice(-4)}`,
        before: null,
        after: { success: true },
      });
    } catch {
      // Non-fatal
    }

    // Set httpOnly cookie
    const res = NextResponse.json({ success: true });
    res.cookies.set("setulix_admin", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 8, // 8 hours
      path: "/",
    });
    return res;
  } catch (err) {
    console.error("[admin-auth/verify-otp]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
