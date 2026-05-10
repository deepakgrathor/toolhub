import { getToken } from "next-auth/jwt";
import { jwtVerify } from "jose";
import { NextResponse, type NextRequest } from "next/server";

// ── Maintenance mode cache (60s TTL, Edge-compatible HTTP fetch) ──────────────

let _maintenanceCache: { value: boolean; expiresAt: number } | null = null;

async function checkMaintenanceMode(): Promise<boolean> {
  const now = Date.now();
  if (_maintenanceCache && now < _maintenanceCache.expiresAt) {
    return _maintenanceCache.value;
  }
  try {
    const url = process.env.UPSTASH_REDIS_URL;
    const token = process.env.UPSTASH_REDIS_TOKEN;
    if (!url || !token) return false;

    const res = await fetch(`${url}/get/site:maintenance_mode`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return false;

    const data = await res.json();
    const value = data?.result === "1" || data?.result === true;
    _maintenanceCache = { value, expiresAt: now + 60_000 };
    return value;
  } catch {
    return false;
  }
}

// ── Verify the setulix.admin cookie (Edge-safe jose) ─────────────────────────

async function verifyAdminCookie(req: NextRequest): Promise<boolean> {
  try {
    const adminToken = req.cookies.get("setulix.admin")?.value;
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

  // ── Step 2: Admin routes — use setulix.admin cookie (independent of NextAuth)
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
      // Clear stale cookie if present
      res.cookies.set("setulix.admin", "", { maxAge: 0, path: "/" });
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

  // ── Step 4: Maintenance mode ──────────────────────────────────────────────
  const maintenance = await checkMaintenanceMode();
  const isAdminForMaintenance = await verifyAdminCookie(req);

  if (maintenance && !isAdminForMaintenance) {
    if (pathname !== "/maintenance") {
      return NextResponse.redirect(new URL("/maintenance", req.url));
    }
    return response;
  }

  if (!maintenance && pathname === "/maintenance") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // ── Step 5: Web-app protected routes ─────────────────────────────────────
  if (pathname.startsWith("/dashboard") && !isLoggedIn) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
