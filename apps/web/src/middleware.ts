import { auth } from "@/auth";
import { NextResponse } from "next/server";

// ── Maintenance mode cache (60s TTL) ─────────────────────────────────────────
// Uses Upstash Redis REST (HTTP-only, Edge-compatible).
// Falls back to false if Redis is not configured (dev without Redis).

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

export default auth(async (req) => {
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

  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;
  const isAdmin = req.auth?.user?.role === "admin";

  // ── Step 2: Maintenance mode ──────────────────────────────────────────────
  const maintenance = await checkMaintenanceMode();

  if (maintenance && !isAdmin) {
    if (pathname !== "/maintenance") {
      return NextResponse.redirect(new URL("/maintenance", req.url));
    }
    return response;
  }

  if (!maintenance && pathname === "/maintenance") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // ── Step 3: Auth-protected route checks ───────────────────────────────────
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
