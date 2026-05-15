import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { connectDB, User } from "@toolhub/db";
import { processUserRollover } from "@/lib/credit-rollover";

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

  await connectDB();

  const subscribers = await User.find({
    plan: { $in: ["lite", "pro", "business"] },
    isDeleted: { $ne: true },
  })
    .select("_id plan")
    .lean();

  let processed = 0;
  const batchSize = 50;

  for (let i = 0; i < subscribers.length; i += batchSize) {
    const batch = subscribers.slice(i, i + batchSize);
    await Promise.allSettled(
      batch.map((user) =>
        processUserRollover(user._id.toString(), user.plan ?? "free")
      )
    );
    processed += batch.length;
  }

  return NextResponse.json({ success: true, processed });
}
