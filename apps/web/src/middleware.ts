import { jwtVerify } from "jose";
import { NextResponse, type NextRequest } from "next/server";

// ── WHY getToken() IS NOT USED HERE ──────────────────────────────────────────
// NextAuth v5 sets cookie "authjs.session-token".
// next-auth/jwt's getToken() defaults to reading "next-auth.session-token" (v4).
// Using getToken() on a v5 session always returns null → middleware thinks user
// is unauthenticated → redirects /dashboard → / → homepage sees valid auth()
// session → redirects back to /dashboard → INFINITE LOOP.
//
// Solution: remove getToken() from middleware entirely.
// /dashboard is already protected by its own server component (auth() check).
// /tools pages show preview without login (by design — paywall is in-page).
// ─────────────────────────────────────────────────────────────────────────────

// ── MAINTENANCE MODE CHECK ALSO DISABLED ─────────────────────────────────────
// Async fetch() inside Edge middleware adds latency on every request and
// interferes with Next.js 14 Suspense streaming. Maintenance mode is managed
// from the admin panel only. Re-enable via rewrites + a dedicated Edge API
// route that sets a request header — never inline in middleware.
// ─────────────────────────────────────────────────────────────────────────────

// ── Verify the setulix_admin cookie (Edge-safe jose) ─────────────────────────

async function verifyAdminCookie(req: NextRequest): Promise<boolean> {
  try {
    const adminToken = req.cookies.get("setulix_admin")?.value;
    if (!adminToken) return false;

    const secret = process.env.ADMIN_JWT_SECRET;
    if (!secret) return false;

    await jwtVerify(adminToken, new TextEncoder().encode(secret));
    return true;
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ── Step 1: Referral cookie ───────────────────────────────────────────────
  const ref = req.nextUrl.searchParams.get("ref");
  const response = NextResponse.next();

  if (ref && /^[A-Z0-9]{6}$/.test(ref)) {
    response.cookies.set("ref", ref, {
      maxAge: 604800,
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });
  }

  // ── Step 2: Admin routes — setulix_admin cookie (completely separate from NextAuth)
  if (pathname.startsWith("/admin")) {
    const isAdminAuthed = await verifyAdminCookie(req);

    if (pathname === "/admin/login") {
      // Already logged in → skip login page
      if (isAdminAuthed) {
        return NextResponse.redirect(new URL("/admin", req.url));
      }
      return response;
    }

    // All other /admin/* require a valid admin cookie
    if (!isAdminAuthed) {
      const res = NextResponse.redirect(new URL("/admin/login", req.url));
      res.cookies.set("setulix_admin", "", { maxAge: 0, path: "/" });
      return res;
    }

    return response;
  }

  // ── Step 3: All other routes — pass through ───────────────────────────────
  // Web-app route protection (dashboard, tools) is handled by individual
  // server components via auth() — not here. See notes at top of file.
  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
