import { jwtVerify, jwtDecrypt } from "jose";
import { NextResponse, type NextRequest } from "next/server";

// Routes excluded from auth + onboarding gates
const ALWAYS_PUBLIC_PREFIXES = [
  "/about",
  "/pricing",
  "/tools",
  "/kits",
  "/onboarding",
  "/api/onboarding",
  "/api/public",
  "/api/auth",
  "/api/referral",
  "/api/admin-auth",
  "/maintenance",
  "/_next",
  "/favicon",
  "/sitemap",
  "/robots",
];

// App routes that require an authenticated session
const APP_ROUTES = ["/dashboard", "/profile", "/explore", "/history", "/refer"];

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

// Auth.js v5 uses JWE (A256CBC-HS512). Key derivation:
//   HKDF-SHA256, salt = cookie name, info = "Auth.js Generated Encryption Key (${cookieName})", 64 bytes
async function deriveAuthKey(secret: string, cookieName: string): Promise<Uint8Array> {
  const te = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    te.encode(secret),
    { name: "HKDF" },
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: te.encode(cookieName),
      info: te.encode(`Auth.js Generated Encryption Key (${cookieName})`),
    },
    keyMaterial,
    512  // 64 bytes — A256CBC-HS512 requires 512-bit key
  );
  return new Uint8Array(bits);
}

async function getSessionPayload(
  req: NextRequest
): Promise<Record<string, unknown> | null> {
  const SECURE = "__Secure-authjs.session-token";
  const PLAIN  = "authjs.session-token";

  const secureCookieValue = req.cookies.get(SECURE)?.value;
  const plainCookieValue  = req.cookies.get(PLAIN)?.value;

  const sessionCookie = secureCookieValue ?? plainCookieValue;
  const cookieName    = secureCookieValue ? SECURE : PLAIN;

  if (!sessionCookie) return null;
  try {
    const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? "";
    const key = await deriveAuthKey(secret, cookieName);
    const { payload } = await jwtDecrypt(sessionCookie, key, {
      clockTolerance: 15,
      keyManagementAlgorithms: ["dir"],
      contentEncryptionAlgorithms: ["A256CBC-HS512", "A256GCM"],
    });
    return payload as Record<string, unknown>;
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ── Referral cookie ──────────────────────────────────────────────────────
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

  // ── Static files ─────────────────────────────────────────────────────────
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return response;
  }

  // ── Admin routes (completely separate auth) ───────────────────────────────
  if (pathname.startsWith("/admin")) {
    const isAdminAuthed = await verifyAdminCookie(req);
    if (pathname === "/admin/login") {
      if (isAdminAuthed)
        return NextResponse.redirect(new URL("/admin", req.url));
      return response;
    }
    if (!isAdminAuthed) {
      const res = NextResponse.redirect(new URL("/admin/login", req.url));
      res.cookies.set("setulix_admin", "", { maxAge: 0, path: "/" });
      return res;
    }
    return response;
  }

  // ── Always-public routes ─────────────────────────────────────────────────
  if (
    pathname === "/" ||
    ALWAYS_PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))
  ) {
    return response;
  }

  // ── App routes: require session ───────────────────────────────────────────
  const isAppRoute = APP_ROUTES.some((r) => pathname.startsWith(r));
  if (!isAppRoute) return response;

  const payload = await getSessionPayload(req);

  // No session → back to marketing homepage
  if (!payload) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // Onboarding not complete → force onboarding
  if (payload.onboardingCompleted === false) {
    return NextResponse.redirect(new URL("/onboarding", req.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
