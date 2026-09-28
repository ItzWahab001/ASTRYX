import { describe, it, expect, vi } from "vitest";

vi.mock("../../src/db/postgres.js", async () => {
  const { createPgMemPostgresModule } = await import("../helpers/pgMemFactory.js");
  return createPgMemPostgresModule();
});
vi.mock("../../src/db/redis.js", async () => {
  const { createIoredisMockRedisModule } = await import("../helpers/ioredisMockFactory.js");
  return createIoredisMockRedisModule();
});

import { query } from "../../src/db/postgres.js";
import { upsertRule, getRulesForGuild } from "../../src/repositories/automodRuleRepository.js";

async function seedGuild(guildId: string) {
  await query(`INSERT INTO guild_config (guild_id) VALUES ($1)`, [guildId]);
}

describe("automodRuleRepository (pg-mem + ioredis-mock)", () => {
  it("creates a rule and returns it via getRulesForGuild", async () => {
    await seedGuild("g-rules-1");
    const rule = await upsertRule("g-rules-1", "word_filter", true, { words: ["bad"] });
    expect(rule.enabled).toBe(true);

    const rules = await getRulesForGuild("g-rules-1");
    expect(rules.find((r) => r.ruleType === "word_filter")?.config).toEqual({ words: ["bad"] });
  });

  it("upserting the same rule type updates it in place rather than duplicating", async () => {
    await seedGuild("g-rules-2");
    await upsertRule("g-rules-2", "link_filter", true, { allowedDomains: [] });
    await upsertRule("g-rules-2", "link_filter", false, { allowedDomains: ["discord.com"] });

    const rules = await getRulesForGuild("g-rules-2");
    const linkRules = rules.filter((r) => r.ruleType === "link_filter");
    expect(linkRules.length).toBe(1);
    expect(linkRules[0]?.enabled).toBe(false);
    expect(linkRules[0]?.config).toEqual({ allowedDomains: ["discord.com"] });
  });

  it("invalidates the redis cache on upsert so a subsequent read reflects the new value", async () => {
    await seedGuild("g-rules-3");
    await upsertRule("g-rules-3", "mention_spam", true, { maxMentions: 5 });
    await getRulesForGuild("g-rules-3"); // warms the cache with maxMentions: 5

    await upsertRule("g-rules-3", "mention_spam", true, { maxMentions: 10 });
    const rules = await getRulesForGuild("g-rules-3");
    expect(rules.find((r) => r.ruleType === "mention_spam")?.config).toEqual({ maxMentions: 10 });
  });

  it("returns an empty array for a guild with no configured rules", async () => {
    await seedGuild("g-rules-4-empty");
    expect(await getRulesForGuild("g-rules-4-empty")).toEqual([]);
  });
});
