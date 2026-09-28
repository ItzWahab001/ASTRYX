import { query } from "../db/postgres.js";
import { redis } from "../db/redis.js";

const CACHE_TTL_SECONDS = 300;

function cacheKey(guildId: string) {
  return `antinuke:whitelist:${guildId}`;
}

export async function isWhitelisted(guildId: string, userId: string): Promise<boolean> {
  const cached = await redis.sismember(cacheKey(guildId), userId);
  if (cached === 1) return true;
  // Cache miss doesn't necessarily mean "not whitelisted" — the set may simply not be warmed yet.
  const cacheExists = await redis.exists(cacheKey(guildId));
  if (cacheExists) return false;
  const rows = await query<{ user_id: string }>(
    `SELECT user_id FROM antinuke_whitelist WHERE guild_id = $1`,
    [guildId],
  );
  if (rows.length > 0) {
    await redis.sadd(
      cacheKey(guildId),
      ...rows.map((r) => r.user_id),
    );
  } else {
    // Seed with a sentinel so `exists` is true but membership stays empty.
    await redis.sadd(cacheKey(guildId), "__none__");
  }
  await redis.expire(cacheKey(guildId), CACHE_TTL_SECONDS);
  return rows.some((r) => r.user_id === userId);
}

/** Lists the current anti-nuke whitelist for a guild — read path for the config-view command. */
export async function getWhitelist(guildId: string): Promise<string[]> {
  const rows = await query<{ user_id: string }>(
    `SELECT user_id FROM antinuke_whitelist WHERE guild_id = $1 ORDER BY created_at ASC`,
    [guildId],
  );
  return rows.map((r) => r.user_id);
}

export async function addToWhitelist(guildId: string, userId: string, addedBy: string): Promise<void> {
  await query(
    `INSERT INTO antinuke_whitelist (guild_id, user_id, added_by) VALUES ($1, $2, $3)
     ON CONFLICT (guild_id, user_id) DO NOTHING`,
    [guildId, userId, addedBy],
  );
  await redis.del(cacheKey(guildId));
}

export async function removeFromWhitelist(guildId: string, userId: string): Promise<void> {
  await query(`DELETE FROM antinuke_whitelist WHERE guild_id = $1 AND user_id = $2`, [guildId, userId]);
  await redis.del(cacheKey(guildId));
}

export async function recordIncident(input: {
  guildId: string;
  actorId: string;
  actionCount: number;
  windowSeconds: number;
  response: "quarantined" | "kicked" | "logged_only";
  detail: Record<string, unknown>;
}): Promise<void> {
  await query(
    `INSERT INTO antinuke_incidents (guild_id, actor_id, action_count, window_seconds, response, detail)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [
      input.guildId,
      input.actorId,
      input.actionCount,
      input.windowSeconds,
      input.response,
      JSON.stringify(input.detail),
    ],
  );
}
