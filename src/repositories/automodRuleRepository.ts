import { query } from "../db/postgres.js";
import { redis } from "../db/redis.js";

export type AutomodRuleType = "word_filter" | "link_filter" | "mention_spam" | "message_spam";

export interface AutomodRule<TConfig = Record<string, unknown>> {
  id: number;
  guildId: string;
  ruleType: AutomodRuleType;
  enabled: boolean;
  config: TConfig;
}

function cacheKey(guildId: string) {
  return `automodrules:${guildId}`;
}
const CACHE_TTL_SECONDS = 60;

function fromRow(row: Record<string, unknown>): AutomodRule {
  return {
    id: Number(row.id),
    guildId: row.guild_id as string,
    ruleType: row.rule_type as AutomodRuleType,
    enabled: row.enabled as boolean,
    config: (row.config as Record<string, unknown>) ?? {},
  };
}

export async function getRulesForGuild(guildId: string): Promise<AutomodRule[]> {
  const cached = await redis.get(cacheKey(guildId));
  if (cached) return JSON.parse(cached) as AutomodRule[];
  const rows = await query(`SELECT * FROM automod_rules WHERE guild_id = $1`, [guildId]);
  const rules = rows.map(fromRow);
  await redis.set(cacheKey(guildId), JSON.stringify(rules), "EX", CACHE_TTL_SECONDS);
  return rules;
}

export async function upsertRule(
  guildId: string,
  ruleType: AutomodRuleType,
  enabled: boolean,
  config: Record<string, unknown>,
): Promise<AutomodRule> {
  const rows = await query(
    `INSERT INTO automod_rules (guild_id, rule_type, enabled, config)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (guild_id, rule_type) DO UPDATE SET enabled = $3, config = $4, updated_at = now()
     RETURNING *`,
    [guildId, ruleType, enabled, JSON.stringify(config)],
  );
  await redis.del(cacheKey(guildId));
  return fromRow(rows[0]!);
}
