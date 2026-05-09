import { Queue } from "bullmq";
import IORedis from "ioredis";

if (!process.env.REDIS_URL) {
  throw new Error("REDIS_URL env var is required for Bull MQ");
}

export const redisConnection = new IORedis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null, // Required by Bull MQ
  enableReadyCheck: false,
});

export const aiQueue = new Queue("ai-jobs", { connection: redisConnection });
