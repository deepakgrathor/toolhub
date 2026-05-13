/**
 * Shared pre-execution guard for AI tool routes.
 * Runs plan-access check + abuse-protection check after auth.
 * Returns null on success, or a NextResponse error to return immediately.
 */

import { NextResponse } from "next/server";
import { connectDB, User } from "@toolhub/db";
import { checkAbuseLimit } from "@/lib/abuse-protection";

export async function runToolGuard(
  userId: string,
  toolSlug: string
): Promise<NextResponse | null> {
  await connectDB();

  const user = await User.findById(userId).select("plan").lean();
  const planSlug = user?.plan ?? "free";

  // Abuse protection check only — tools are credit-gated, not plan-gated
  const abuse = await checkAbuseLimit({ userId, toolSlug, planSlug });
  if (!abuse.allowed) {
    return NextResponse.json(
      { error: abuse.reason, code: "rate_limited", retryAfter: abuse.retryAfter },
      {
        status: 429,
        headers: abuse.retryAfter
          ? { "Retry-After": String(abuse.retryAfter) }
          : {},
      }
    );
  }

  return null;
}

/** Fetch user's plan slug — used by /api/user/plan and server components */
export async function getUserPlanSlug(userId: string): Promise<string> {
  await connectDB();
  const user = await User.findById(userId).select("plan").lean();
  return user?.plan ?? "free";
}
