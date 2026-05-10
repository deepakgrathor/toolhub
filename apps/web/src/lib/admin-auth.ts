import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

export interface AdminTokenPayload {
  userId: string;
  email: string;
  name: string;
}

function getSecret(): Uint8Array {
  const secret = process.env.ADMIN_JWT_SECRET;
  if (!secret) throw new Error("ADMIN_JWT_SECRET env var is required");
  return new TextEncoder().encode(secret);
}

export async function createAdminToken(payload: AdminTokenPayload): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(getSecret());
}

export async function verifyAdminToken(token: string): Promise<AdminTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as unknown as AdminTokenPayload;
  } catch {
    return null;
  }
}

// Use in Route Handlers: reads setulix_admin cookie, returns payload or null
export async function requireAdmin(req?: NextRequest): Promise<AdminTokenPayload | null> {
  try {
    let token: string | undefined;
    if (req) {
      token = req.cookies.get("setulix_admin")?.value;
    } else {
      const cookieStore = await cookies();
      token = cookieStore.get("setulix_admin")?.value;
    }
    if (!token) return null;
    return await verifyAdminToken(token);
  } catch {
    return null;
  }
}
