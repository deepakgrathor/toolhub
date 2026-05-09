import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  // ── Step 1: Referral cookie (runs before any auth redirect) ──────────────
  const ref = req.nextUrl.searchParams.get("ref");
  const response = NextResponse.next();

  if (ref && /^[A-Z0-9]{6}$/.test(ref)) {
    response.cookies.set("ref", ref, {
      maxAge: 604800, // 7 days
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });
  }

  // ── Step 2: Auth-protected route checks ───────────────────────────────────
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;
  const isAdmin = req.auth?.user?.role === "admin";

  if (pathname.startsWith("/dashboard") && !isLoggedIn) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  if (pathname.startsWith("/admin") && !isAdmin) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return response;
});

export const config = {
  // Runs on all pages except Next.js internals and static assets
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
