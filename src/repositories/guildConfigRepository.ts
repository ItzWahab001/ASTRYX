import { query } from "../db/postgres.js";
import { redis } from "../db/redis.js";

export interface GuildConfig {
  guildId: string;
  adminRoleIds: string[];
  modLogChannelId: string | null;
  joinLogChannelId: string | null;
  quarantineRoleId: string | null;
  escalationChain: string[];
  escalationThreshold: number;
}

const CACHE_TTL_SECONDS = 60;

function cacheKey(guildId: string) {
  return `guildconfig:${guildId}`;
}

function parseStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value as string[];
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed as string[] : [];
    } catch {
      return [];
    }
  }
  return [];
}

function fromRow(row: Record<string, unknown>): GuildConfig {
  return {
    guildId: row.guild_id as string,
    adminRoleIds: parseStringArray(row.admin_role_ids),
    modLogChannelId: (row.mod_log_channel_id as string | null) ?? null,
    joinLogChannelId: (row.join_log_channel_id as string | null) ?? null,
    quarantineRoleId: (row.quarantine_role_id as string | null) ?? null,
    escalationChain: parseStringArray(row.escalation_chain).length
      ? parseStringArray(row.escalation_chain)
      : ["warn", "mute", "kick", "ban"],
    escalationThreshold: Number(row.escalation_threshold ?? 3),
  };
}

/** Ensures a guild_config row exists (idempotent) — call on guildCreate and lazily on first read. */
export async function ensureGuildConfig(guildId: string): Promise<GuildConfig> {
  const rows = await query(
    `INSERT INTO guild_config (guild_id) VALUES ($1)
     ON CONFLICT (guild_id) DO UPDATE SET guild_id = EXCLUDED.guild_id
     RETURNING *`,
    [guildId],
  );
  const config = fromRow(rows[0]!);
  await redis.set(cacheKey(guildId), JSON.stringify(config), "EX", CACHE_TTL_SECONDS);
  return config;
}

export async function getGuildConfig(guildId: string): Promise<GuildConfig> {
  const cached = await redis.get(cacheKey(guildId));
  if (cached) return JSON.parse(cached) as GuildConfig;
  return ensureGuildConfig(guildId);
}

export async function updateGuildConfig(
  guildId: string,
  patch: Partial<Omit<GuildConfig, "guildId">>,
): Promise<GuildConfig> {
  await ensureGuildConfig(guildId);
  const rows = await query(
    `UPDATE guild_config SET
       admin_role_ids = COALESCE($2, admin_role_ids),
       mod_log_channel_id = COALESCE($3, mod_log_channel_id),
       join_log_channel_id = COALESCE($4, join_log_channel_id),
       quarantine_role_id = COALESCE($5, quarantine_role_id),
       escalation_chain = COALESCE($6, escalation_chain),
       escalation_threshold = COALESCE($7, escalation_threshold),
       updated_at = now()
     WHERE guild_id = $1
     RETURNING *`,
    [
      guildId,
      patch.adminRoleIds ?? null,
      patch.modLogChannelId ?? null,
      patch.joinLogChannelId ?? null,
      patch.quarantineRoleId ?? null,
      patch.escalationChain ? JSON.stringify(patch.escalationChain) : null,
      patch.escalationThreshold ?? null,
    ],
  );
  const config = fromRow(rows[0]!);
  await redis.set(cacheKey(guildId), JSON.stringify(config), "EX", CACHE_TTL_SECONDS);
  return config;
}
