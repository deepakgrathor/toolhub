import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const ref = req.nextUrl.searchParams.get("ref") ?? "";

  // Only accept valid referral codes (6 uppercase alphanumeric chars)
  if (!/^[A-Z0-9]{6}$/.test(ref)) {
    return NextResponse.json({ error: "Invalid ref code" }, { status: 400 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set("ref", ref, {
    maxAge: 60 * 60 * 24 * 30, // 30 days
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
  return res;
}
