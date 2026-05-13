import { NextRequest, NextResponse } from "next/server";
import { connectDB, User, Plan } from "@toolhub/db";
import { sendEmail } from "@/lib/email/sender";
import { renewalReminderEmail } from "@/lib/email/templates";

export async function GET(req: NextRequest) {
  // Secure with CRON_SECRET
  const auth = req.headers.get("authorization");
  const expected = `Bearer ${process.env.CRON_SECRET}`;
  if (auth !== expected) {
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
