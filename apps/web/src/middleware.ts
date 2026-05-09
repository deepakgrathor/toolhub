import { getToken } from "next-auth/jwt";
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

  // ── Step 2: Decode JWT (Edge-safe — no CompressionStream) ─────────────────
  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? "",
  });

  const isLoggedIn = !!token;
  const isAdmin = token?.role === "admin";

  // ── Step 3: Maintenance mode ──────────────────────────────────────────────
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

  // ── Step 4: Auth-protected routes ─────────────────────────────────────────
  if (pathname.startsWith("/dashboard") && !isLoggedIn) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  if (pathname.startsWith("/admin") && !isAdmin) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
