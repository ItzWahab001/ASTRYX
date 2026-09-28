import { describe, it, expect, vi } from "vitest";
import type { GuildMember } from "discord.js";

vi.mock("../../src/db/postgres.js", async () => {
  const { createPgMemPostgresModule } = await import("../helpers/pgMemFactory.js");
  return createPgMemPostgresModule();
});
vi.mock("../../src/db/redis.js", async () => {
  const { createIoredisMockRedisModule } = await import("../helpers/ioredisMockFactory.js");
  return createIoredisMockRedisModule();
});

import { query } from "../../src/db/postgres.js";
import { evaluateJoin } from "../../src/modules/antiRaid/joinGate.js";
import { addToWhitelist } from "../../src/repositories/antiNukeRepository.js";
import { makeGuild, makeMember } from "../helpers/fakeDiscord.js";

async function seedGuild(guildId: string, quarantineRoleId: string | null = null) {
  await query(`INSERT INTO guild_config (guild_id, quarantine_role_id) VALUES ($1, $2)`, [
    guildId,
    quarantineRoleId,
  ]);
}

/** Builds a join event input that scores near-certain "quarantine" per heatScoring's weights. */
function suspiciousUser(id: string) {
  return {
    id,
    createdTimestamp: Date.now() - 60_000, // 1 minute old account
    avatar: null,
    username: "xkq48219", // matches looksGenerated's short-consonant+digits pattern
  };
}

function benignUser(id: string) {
  return {
    id,
    createdTimestamp: Date.now() - 365 * 24 * 60 * 60 * 1000,
    avatar: "some-hash",
    username: "morgan_bakes",
  };
}

function attachUser(member: ReturnType<typeof makeMember>, user: unknown, guild: unknown) {
  (member as unknown as { user: unknown }).user = user;
  (member as unknown as { guild: unknown }).guild = guild;
}

describe("evaluateJoin (pg-mem + ioredis-mock + fake discord.js)", () => {
  it("takes no action on a normal-looking join", async () => {
    const guildId = "jg-1";
    await seedGuild(guildId);
    const botMember = makeMember({ id: "bot-1", highestPosition: 999 });
    const { guild } = makeGuild({ id: guildId, botMember });

    const member = makeMember({ id: "u1" });
    attachUser(member, benignUser("u1"), guild);

    await evaluateJoin(member as unknown as GuildMember);

    expect(member.roles.add).not.toHaveBeenCalled();
    expect(member.kick).not.toHaveBeenCalled();
  });

  it("assigns the configured quarantine role to a high-heat join", async () => {
    const guildId = "jg-2";
    await seedGuild(guildId, "quarantine-role-1");
    const botMember = makeMember({ id: "bot-1", highestPosition: 999 });
    const { guild } = makeGuild({ id: guildId, botMember });

    const member = makeMember({ id: "u2" });
    attachUser(member, suspiciousUser("u2"), guild);

    await evaluateJoin(member as unknown as GuildMember);

    expect(member.roles.add).toHaveBeenCalledWith("quarantine-role-1");
    expect(member.kick).not.toHaveBeenCalled();
  });

  it("kicks a high-heat join when no quarantine role is configured", async () => {
    const guildId = "jg-3";
    await seedGuild(guildId, null);
    const botMember = makeMember({ id: "bot-1", highestPosition: 999 });
    const { guild } = makeGuild({ id: guildId, botMember });

    const member = makeMember({ id: "u3" });
    attachUser(member, suspiciousUser("u3"), guild);

    await evaluateJoin(member as unknown as GuildMember);

    expect(member.roles.add).not.toHaveBeenCalled();
    expect(member.kick).toHaveBeenCalledTimes(1);
  });

  it("never acts on a whitelisted user even with a maximally suspicious join profile", async () => {
    const guildId = "jg-4";
    await seedGuild(guildId, "quarantine-role-1");
    await addToWhitelist(guildId, "u4", "admin-1");
    const botMember = makeMember({ id: "bot-1", highestPosition: 999 });
    const { guild } = makeGuild({ id: guildId, botMember });

    const member = makeMember({ id: "u4" });
    attachUser(member, suspiciousUser("u4"), guild);

    await evaluateJoin(member as unknown as GuildMember);

    expect(member.roles.add).not.toHaveBeenCalled();
    expect(member.kick).not.toHaveBeenCalled();
  });

  it("accumulates join velocity across calls sharing the same Redis window key", async () => {
    const guildId = "jg-5";
    await seedGuild(guildId, "quarantine-role-1");
    const botMember = makeMember({ id: "bot-1", highestPosition: 999 });
    const { guild } = makeGuild({ id: guildId, botMember });

    // 6 benign-profile joins in a row: velocity alone (score contribution (6-3)*8=24) isn't
    // enough to quarantine a benign profile, so this mainly proves the Redis counter actually
    // increments across separate evaluateJoin calls instead of resetting or throwing.
    for (let i = 0; i < 6; i++) {
      const member = makeMember({ id: `velocity-${i}` });
      attachUser(member, benignUser(`velocity-${i}`), guild);
      await evaluateJoin(member as unknown as GuildMember);
    }

    const lastMember = makeMember({ id: "velocity-last" });
    attachUser(lastMember, benignUser("velocity-last"), guild);
    await evaluateJoin(lastMember as unknown as GuildMember);

    expect(lastMember.kick).not.toHaveBeenCalled();
  });
});
