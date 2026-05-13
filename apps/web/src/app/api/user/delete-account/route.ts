import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB, User } from "@toolhub/db";
import { getRedis } from "@toolhub/shared";
import { sendEmail } from "@/lib/email/sender";
import { accountDeletionEmail } from "@/lib/email/templates";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();

  await User.findByIdAndUpdate(session.user.id, {
    isDeleted: true,
    deletedAt: new Date(),
    status: "deleted",
  });

  try {
    const redis = getRedis();
    const userId = session.user.id;
    await Promise.all([
      redis.del(`balance:${userId}`),
      redis.del(`workspace:${userId}`),
      redis.del(`sidebar:${userId}`),
      redis.del(`autofill:${userId}`),
      redis.del(`SetuLix:user:${userId}`),
    ]);
  } catch {
    // silent
  }

  // Send deletion confirmation email (fire-and-forget)
  if (session.user.email) {
    const { subject, html } = accountDeletionEmail({ name: session.user.name ?? "User" });
    void sendEmail({ to: session.user.email, subject, html });
  }

  return NextResponse.json({ ok: true });
}
