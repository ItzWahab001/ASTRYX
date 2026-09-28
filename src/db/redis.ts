import { Redis } from "ioredis";
import { env } from "../config/env.js";
import { childLogger } from "../utils/logger.js";

const log = childLogger("redis");

export const redis = new Redis(env.redisUrl(), {
  maxRetriesPerRequest: 3,
  retryStrategy: (times: number) => Math.min(times * 200, 2000),
});

redis.on("error", (err: Error) => log.error({ err }, "Redis connection error"));
redis.on("connect", () => log.info("Redis connected"));

/**
 * Sliding-window counter: increments a key, sets expiry on first write, returns the new count.
 * Used for automod message-spam detection, anti-nuke action-rate detection, and anti-raid join velocity.
 */
export async function incrWithWindow(key: string, windowSeconds: number): Promise<number> {
  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, windowSeconds);
  }
  return count;
}
