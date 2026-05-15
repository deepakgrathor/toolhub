import { createHmac, timingSafeEqual } from "crypto";

function getSecret(): string {
  const s = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET / NEXTAUTH_SECRET env var is not set");
  return s;
}

// HMAC-SHA256 — rainbow tables are useless without the server secret
export function hashOtp(otp: string): string {
  return createHmac("sha256", getSecret()).update(otp).digest("hex");
}

// Constant-time comparison — prevents timing side-channel attacks
export function verifyOtp(submittedOtp: string, storedHash: string): boolean {
  const submittedHash = hashOtp(submittedOtp);
  const a = Buffer.from(submittedHash);
  const b = Buffer.from(storedHash);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
