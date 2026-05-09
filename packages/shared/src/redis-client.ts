import { Redis } from "@upstash/redis";

let _instance: Redis | null = null;

export function getRedis(): Redis {
  if (!_instance) {
    const url = process.env.UPSTASH_REDIS_URL;
    const token = process.env.UPSTASH_REDIS_TOKEN;
    if (!url || !token) {
      throw new Error(
        "UPSTASH_REDIS_URL and UPSTASH_REDIS_TOKEN env vars are required"
      );
    }
    _instance = new Redis({ url, token });
  }
  return _instance;
}
