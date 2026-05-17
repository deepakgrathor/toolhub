import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { connectDB, User } from "@toolhub/db";
import { processUserRollover } from "@/lib/credit-rollover";
import { getSiteConfigValue } from "@/lib/site-config-cache";

export const dynamic = "force-dynamic";

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

  // Check credit_rollover_enabled SiteConfig flag before doing any work
  const rolloverEnabled = await getSiteConfigValue(
    "credit_rollover_enabled",
    false
  ) as boolean;

  if (!rolloverEnabled) {
    console.log("[cron/rollover] Credit rollover disabled via SiteConfig. Skipping.");
    return NextResponse.json({
      success: true,
      skipped: true,
      reason: "rollover_disabled",
    });
  }

  await connectDB();

  // Include enterprise (creditRolloverMonths: -1 = unlimited)
  const subscribers = await User.find({
    plan: { $in: ["lite", "pro", "business", "enterprise"] },
    isDeleted: { $ne: true },
  })
    .select("_id plan")
    .lean();

  console.log(`[cron/rollover] Processing ${subscribers.length} users`);

  const batchSize = 50;
  let processed = 0;
  let failed = 0;

  for (let i = 0; i < subscribers.length; i += batchSize) {
    const batch = subscribers.slice(i, i + batchSize);
    const results = await Promise.allSettled(
      batch.map((user) =>
        processUserRollover(user._id.toString(), user.plan ?? "free")
      )
    );

    results.forEach((result, idx) => {
      if (result.status === "fulfilled") {
        processed++;
      } else {
        failed++;
        console.error(
          `[cron/rollover] Failed for user ${batch[idx]._id}:`,
          result.reason
        );
      }
    });
  }

  console.log(`[cron/rollover] Complete. Processed: ${processed}, Failed: ${failed}`);

  return NextResponse.json({
    success: true,
    total: subscribers.length,
    processed,
    failed,
  });
}
