import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { connectDB } from "@toolhub/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const [mongoStatus, redisStatus] = await Promise.allSettled([
    connectDB().then(async (conn) => {
      await conn.connection.db!.command({ ping: 1 });
      return true;
    }),
    (async () => {
      const url = process.env.UPSTASH_REDIS_REST_URL;
      const token = process.env.UPSTASH_REDIS_REST_TOKEN;
      if (!url || !token) return false;
      const res = await fetch(`${url}/ping`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(3000),
        cache: "no-store",
      });
      return res.ok;
    })(),
  ]);

  return NextResponse.json({
    mongodb: mongoStatus.status === "fulfilled" && mongoStatus.value === true,
    redis: redisStatus.status === "fulfilled" && redisStatus.value === true,
    checkedAt: new Date().toISOString(),
  });
}
