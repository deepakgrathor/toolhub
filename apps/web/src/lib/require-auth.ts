import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { Session } from "next-auth";

// TODO: Gradually replace auth pattern in remaining routes

type AuthResult =
  | { authenticated: true; userId: string; session: Session }
  | { authenticated: false; response: NextResponse };

export async function requireAuth(): Promise<AuthResult> {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      authenticated: false,
      response: NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      ),
    };
  }

  return {
    authenticated: true,
    userId: session.user.id,
    session,
  };
}
