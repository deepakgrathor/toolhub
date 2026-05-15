import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { connectDB, User, Plan } from "@toolhub/db";
import { sendEmail } from "@/lib/email/sender";
import { renewalReminderEmail } from "@/lib/email/templates";

function verifyCronSecret(provided: string): boolean {
  const expected = process.env.CRON_SECRET ?? "";
  if (!provided || !expected) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization") ?? "";
  if (!verifyCronSecret(authHeader.replace("Bearer ", ""))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();

  const now = new Date();
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 86400000);

  // Find users whose plan expires within 7 days (not yet expired, not already reminded)
  const users = await User.find({
    plan: { $ne: "free" },
    planExpiry: { $exists: true, $ne: null, $lte: sevenDaysFromNow, $gt: now },
    renewalReminderSent: { $ne: true },
  }).limit(100);

  let processed = 0;

  for (const user of users) {
    try {
      const daysLeft = Math.ceil(
        ((user.planExpiry as Date).getTime() - now.getTime()) / 86400000
      );

      // Get plan name
      const plan = await Plan.findOne({ slug: user.plan });
      const planName = plan?.name || user.plan.toUpperCase();

      sendEmail({
        to: user.email,
        ...renewalReminderEmail({ name: user.name, planName, daysLeft }),
      }).catch(console.error);

      // Mark reminder sent
      await User.findByIdAndUpdate(user._id, { renewalReminderSent: true });
      processed++;
    } catch (err) {
      console.error(`[renewal-reminder] Failed for user ${user._id}:`, err);
    }
  }

  return NextResponse.json({ processed });
}
