import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { Queue } from "bullmq";
import IORedis from "ioredis";
import { z } from "zod";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  jobType: z.enum(["text-generation", "image-generation"]),
  payload: z.record(z.unknown()),
});

// Module-level queue — reused across requests in the same Node.js instance
let _queue: Queue | null = null;

function getQueue(): Queue {
  if (!_queue) {
    if (!process.env.REDIS_URL) {
      throw new Error("REDIS_URL is not configured");
    }
    const connection = new IORedis(process.env.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });
    _queue = new Queue("ai-jobs", { connection });
  }
  return _queue;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  try {
    const queue = getQueue();
    const job = await queue.add(parsed.data.jobType, {
      ...parsed.data.payload,
      userId: session.user.id,
    });

    return NextResponse.json({ jobId: job.id });
  } catch (err) {
    console.error("[POST /api/jobs/create]", err);
    return NextResponse.json({ error: "queue_unavailable" }, { status: 503 });
  }
}
