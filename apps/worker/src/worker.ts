import { Worker, type Job } from "bullmq";
import { redisConnection } from "./queue";
import { getRedis } from "@toolhub/shared";
import { processTextGeneration } from "./jobs/text-generation";
import { processImageGeneration } from "./jobs/image-generation";

const redis = getRedis();

const worker = new Worker(
  "ai-jobs",
  async (job: Job) => {
    console.log(`[worker] Processing job ${job.id} (${job.name})`);

    if (job.name === "text-generation") {
      return processTextGeneration(job);
    }
    if (job.name === "image-generation") {
      return processImageGeneration(job);
    }
    throw new Error(`Unknown job type: ${job.name}`);
  },
  {
    connection: redisConnection,
    concurrency: 5,
  }
);

worker.on("completed", async (job, result) => {
  console.log(`[worker] Job ${job.id} completed`);
  await redis.set(`job:${job.id}:result`, JSON.stringify(result), {
    ex: 3600,
  });
});

worker.on("failed", async (job, err) => {
  console.error(`[worker] Job ${job?.id} failed:`, err.message);
  if (job?.id) {
    await redis.set(`job:${job.id}:error`, err.message, { ex: 3600 });
  }
});

worker.on("error", (err) => {
  console.error("[worker] Worker error:", err);
});

export { worker };
