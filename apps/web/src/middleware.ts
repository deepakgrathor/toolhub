import { getToken } from "next-auth/jwt";
import { jwtVerify } from "jose";
import { NextResponse, type NextRequest } from "next/server";

// ── MAINTENANCE MODE CHECK DISABLED ──────────────────────────────────────────
// Async fetch() inside Edge middleware causes request-timing issues on
// /dashboard (streaming + Suspense) that manifest as repeated reloads.
// Maintenance mode is enforced via the admin panel only — not middleware.
// To re-enable: use a Redis HTTP call in a standalone Edge API route and
// pass the result via a request header using Next.js rewrites, never inline.
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

  // ── Step 2: Admin routes — use setulix_admin cookie (independent of NextAuth)
  if (pathname.startsWith("/admin")) {
    const isAdminAuthed = await verifyAdminCookie(req);

    // Allow login page; redirect if already logged in
    if (pathname === "/admin/login") {
      if (isAdminAuthed) {
        return NextResponse.redirect(new URL("/admin", req.url));
      }
      return response;
    }

    // All other /admin/* — require valid admin cookie
    if (!isAdminAuthed) {
      const loginUrl = new URL("/admin/login", req.url);
      const res = NextResponse.redirect(loginUrl);
      // Clear stale/invalid cookie if present
      res.cookies.set("setulix_admin", "", { maxAge: 0, path: "/" });
      return res;
    }

    return response;
  }

  // ── Step 3: Decode NextAuth JWT for web-app routes ────────────────────────
  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? "",
  });

  const isLoggedIn = !!token;

  // ── Step 4: Web-app protected routes ─────────────────────────────────────
  if (pathname.startsWith("/dashboard") && !isLoggedIn) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
