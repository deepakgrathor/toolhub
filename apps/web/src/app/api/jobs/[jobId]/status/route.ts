import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getRedis } from "@toolhub/shared";
import { Queue } from "bullmq";
import IORedis from "ioredis";

export const dynamic = "force-dynamic";

type JobStatus = "queued" | "processing" | "done" | "failed";

let _queue: Queue | null = null;

function getQueue(): Queue | null {
  if (!process.env.REDIS_URL) return null;
  if (!_queue) {
    const connection = new IORedis(process.env.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });
    _queue = new Queue("ai-jobs", { connection });
  }
  return _queue;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { jobId: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { jobId } = params;
  const redis = getRedis();

  // Check stored result first (set by worker on completion)
  const [rawResult, rawError] = await Promise.all([
    redis.get<string>(`job:${jobId}:result`),
    redis.get<string>(`job:${jobId}:error`),
  ]);

  if (rawResult) {
    let result: unknown;
    try {
      result = typeof rawResult === "string" ? JSON.parse(rawResult) : rawResult;
    } catch {
      result = rawResult;
    }
    return NextResponse.json({ status: "done" as JobStatus, result });
  }

  if (rawError) {
    return NextResponse.json({
      status: "failed" as JobStatus,
      error: rawError,
    });
  }

  // Neither key exists — check queue for live status
  const queue = getQueue();
  if (queue) {
    try {
      const job = await queue.getJob(jobId);
      if (job) {
        const state = await job.getState();
        const statusMap: Record<string, JobStatus> = {
          waiting: "queued",
          delayed: "queued",
          active: "processing",
          completed: "done",
          failed: "failed",
          prioritized: "queued",
          "waiting-children": "processing",
        };
        const status: JobStatus = statusMap[state] ?? "queued";
        return NextResponse.json({ status });
      }
    } catch {
      // Queue unavailable — fall through to queued default
    }
  }

  return NextResponse.json({ status: "queued" as JobStatus });
}
