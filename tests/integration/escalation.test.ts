import { describe, it, expect, vi } from "vitest";
import type { Guild } from "discord.js";

vi.mock("../../src/db/postgres.js", async () => {
  const { createPgMemPostgresModule } = await import("../helpers/pgMemFactory.js");
  return createPgMemPostgresModule();
});
vi.mock("../../src/db/redis.js", async () => {
  const { createIoredisMockRedisModule } = await import("../helpers/ioredisMockFactory.js");
  return createIoredisMockRedisModule();
});

import { query } from "../../src/db/postgres.js";
import { applyEscalation } from "../../src/modules/moderation/escalation.js";
import { makeGuild, makeMember } from "../helpers/fakeDiscord.js";

async function seedGuild(guildId: string, escalationThreshold = 3) {
  await query(`INSERT INTO guild_config (guild_id, escalation_threshold) VALUES ($1, $2)`, [
    guildId,
    escalationThreshold,
  ]);
}

describe("applyEscalation (pg-mem + ioredis-mock + fake discord.js)", () => {
  it("first infraction escalates to warn and persists a case", async () => {
    const guildId = "esc-1";
    await seedGuild(guildId);
    const { guild } = makeGuild({ id: guildId });

    const result = await applyEscalation({
      guild: guild as unknown as Guild,
      targetId: "u1",
      reason: "first violation",
      source: "automod",
    });

    expect(result.actionTaken).toBe("warn");
    expect(result.caseNumber).toBe(1);

    const cases = await query(`SELECT * FROM moderation_cases WHERE guild_id = $1`, [guildId]);
    expect(cases.length).toBe(1);
  });

  it("escalates to mute once the infraction threshold is crossed, and calls the real timeout API", async () => {
    const guildId = "esc-2";
    await seedGuild(guildId, 1); // every single infraction steps the chain forward
    const target = makeMember({ id: "u2", highestPosition: 1 });
    const { guild } = makeGuild({ id: guildId, members: [target] });

    // infraction #1 -> stepIndex 0 -> warn
    await applyEscalation({ guild: guild as unknown as Guild, targetId: "u2", reason: "r1", source: "automod" });
    // infraction #2 -> stepIndex 1 -> mute
    const result = await applyEscalation({
      guild: guild as unknown as Guild,
      targetId: "u2",
      reason: "r2",
      source: "automod",
    });

    expect(result.actionTaken).toBe("mute");
    expect(target.timeout).toHaveBeenCalledTimes(1);
  });

  it("degrades to warn (and still persists a case) when the bot lacks the required permission", async () => {
    const guildId = "esc-3";
    await seedGuild(guildId, 1);
    const target = makeMember({ id: "u3", highestPosition: 1 });
    const botMember = makeMember({ id: "bot-1", highestPosition: 999, hasPermission: false });
    const { guild } = makeGuild({ id: guildId, members: [target], botMember });

    await applyEscalation({ guild: guild as unknown as Guild, targetId: "u3", reason: "r1", source: "automod" });
    const result = await applyEscalation({
      guild: guild as unknown as Guild,
      targetId: "u3",
      reason: "r2",
      source: "automod",
    });

    expect(result.actionTaken).toBe("warn");
    expect(target.timeout).not.toHaveBeenCalled();
    const cases = await query(`SELECT * FROM moderation_cases WHERE guild_id = $1`, [guildId]);
    expect(cases.length).toBe(2); // both infractions still recorded as cases
  });

  it("degrades to warn when the target has already left the guild (fetch returns null)", async () => {
    const guildId = "esc-4";
    await seedGuild(guildId, 1);
    const { guild } = makeGuild({ id: guildId, members: [] }); // "u4" is not a current member

    await applyEscalation({ guild: guild as unknown as Guild, targetId: "u4", reason: "r1", source: "automod" });
    const result = await applyEscalation({
      guild: guild as unknown as Guild,
      targetId: "u4",
      reason: "r2",
      source: "automod",
    });

    expect(result.actionTaken).toBe("warn");
  });

  it("caps the escalation step at the top of the configured chain instead of throwing", async () => {
    const guildId = "esc-5";
    await seedGuild(guildId, 1);
    const target = makeMember({ id: "u5", highestPosition: 1 });
    const { guild } = makeGuild({ id: guildId, members: [target] });

    let last: Awaited<ReturnType<typeof applyEscalation>> | undefined;
    for (let i = 0; i < 6; i++) {
      last = await applyEscalation({
        guild: guild as unknown as Guild,
        targetId: "u5",
        reason: `violation ${i}`,
        source: "automod",
      });
    }
    // Chain is warn -> mute -> kick -> ban; six infractions at threshold 1 should land on "ban"
    // (the final step) rather than index out of bounds.
    expect(last?.actionTaken).toBe("ban");
  });
});
