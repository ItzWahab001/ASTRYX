/**
 * Builds a drop-in replacement for src/db/redis.ts's exports (`redis`, `incrWithWindow`), backed
 * by ioredis-mock. Same rationale as pgMemFactory.ts: repository/module code calls the real
 * `incrWithWindow`/`redis.get`/`redis.set`/etc. logic, only the underlying transport is swapped.
 */
export async function createIoredisMockRedisModule() {
  const { default: IORedisMock } = await import("ioredis-mock");
  const redis = new IORedisMock();

  async function incrWithWindow(key: string, windowSeconds: number): Promise<number> {
    const count = await redis.incr(key);
    if (count === 1) {
      await redis.expire(key, windowSeconds);
    }
    return count;
  }

  return { redis, incrWithWindow };
}
