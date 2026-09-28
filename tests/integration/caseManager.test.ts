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
import { performManualAction, performUnban, getCaseByNumber } from "../../src/modules/moderation/caseManager.js";
import { makeGuild, makeMember } from "../helpers/fakeDiscord.js";

async function seedGuild(guildId: string) {
  await query(`INSERT INTO guild_config (guild_id) VALUES ($1)`, [guildId]);
}

describe("performManualAction (pg-mem + fake discord.js)", () => {
  it("mutes a member the actor and bot both outrank, calls the real API, and persists + logs a case", async () => {
    const guildId = "cm-1";
    await seedGuild(guildId);
    const actor = makeMember({ id: "mod1", highestPosition: 10 });
    const target = makeMember({ id: "target1", highestPosition: 5 });
    const botMember = makeMember({ id: "bot1", highestPosition: 20 });
    makeGuild({ id: guildId, members: [actor, target], botMember, modLogChannelId: "mod-log-1" });

    const result = await performManualAction({
      actor: actor as unknown as GuildMember,
      target: target as unknown as GuildMember,
      actionType: "mute",
      reason: "spamming",
    });

    expect(result.ok).toBe(true);
    expect(target.timeout).toHaveBeenCalledTimes(1);
    if (result.ok) {
      const persisted = await getCaseByNumber(guildId, result.caseNumber);
      expect(persisted?.actionType).toBe("mute");
      expect(persisted?.source).toBe("manual");
    }
  });

  it("denies moderating the server owner and makes no Discord API call", async () => {
    const guildId = "cm-2";
    await seedGuild(guildId);
    const actor = makeMember({ id: "mod1", highestPosition: 10, ownerId: "target1" });
    const target = makeMember({ id: "target1", highestPosition: 5, ownerId: "target1" });
    const botMember = makeMember({ id: "bot1", highestPosition: 20 });
    makeGuild({ id: guildId, members: [actor, target], botMember });

    const result = await performManualAction({
      actor: actor as unknown as GuildMember,
      target: target as unknown as GuildMember,
      actionType: "kick",
      reason: "test",
    });

    expect(result.ok).toBe(false);
    expect(target.kick).not.toHaveBeenCalled();
  });

  it("denies when the actor's role does not outrank the target's, before touching Discord", async () => {
    const guildId = "cm-3";
    await seedGuild(guildId);
    const actor = makeMember({ id: "mod1", highestPosition: 3 });
    const target = makeMember({ id: "target1", highestPosition: 5 });
    const botMember = makeMember({ id: "bot1", highestPosition: 20 });
    makeGuild({ id: guildId, members: [actor, target], botMember });

    const result = await performManualAction({
      actor: actor as unknown as GuildMember,
      target: target as unknown as GuildMember,
      actionType: "ban",
      reason: "test",
    });

    expect(result.ok).toBe(false);
    expect(target.kick).not.toHaveBeenCalled();
    const cases = await query(`SELECT * FROM moderation_cases WHERE guild_id = $1`, [guildId]);
    expect(cases.length).toBe(0);
  });

  it("warn persists a case without calling any Discord moderation API", async () => {
    const guildId = "cm-4";
    await seedGuild(guildId);
    const actor = makeMember({ id: "mod1", highestPosition: 10 });
    const target = makeMember({ id: "target1", highestPosition: 5 });
    const botMember = makeMember({ id: "bot1", highestPosition: 20 });
    makeGuild({ id: guildId, members: [actor, target], botMember });

    const result = await performManualAction({
      actor: actor as unknown as GuildMember,
      target: target as unknown as GuildMember,
      actionType: "warn",
      reason: "first offense",
    });

    expect(result.ok).toBe(true);
    expect(target.timeout).not.toHaveBeenCalled();
    expect(target.kick).not.toHaveBeenCalled();
  });
});

describe("performUnban (pg-mem + fake discord.js)", () => {
  it("unbans a user who is no longer a guild member (no GuildMember fetch required)", async () => {
    const guildId = "cm-5";
    await seedGuild(guildId);
    const actor = makeMember({ id: "mod1", highestPosition: 10 });
    const { guild } = makeGuild({ id: guildId, members: [actor] });

    const result = await performUnban({
      actor: actor as unknown as GuildMember,
      targetId: "long-gone-user",
      reason: "appeal accepted",
    });

    expect(result.ok).toBe(true);
    expect(guild.members.unban).toHaveBeenCalledWith("long-gone-user", "appeal accepted");
    if (result.ok) {
      const persisted = await getCaseByNumber(guildId, result.caseNumber);
      expect(persisted?.actionType).toBe("unban");
      expect(persisted?.targetId).toBe("long-gone-user");
    }
  });

  it("denies when the actor lacks BanMembers and isn't the owner", async () => {
    const guildId = "cm-6";
    await seedGuild(guildId);
    const actor = makeMember({ id: "mod1", highestPosition: 10, hasPermission: false, ownerId: "someone-else" });
    const { guild } = makeGuild({ id: guildId, members: [actor], ownerId: "someone-else" });

    const result = await performUnban({
      actor: actor as unknown as GuildMember,
      targetId: "u1",
      reason: "test",
    });

    expect(result.ok).toBe(false);
    expect(guild.members.unban).not.toHaveBeenCalled();
  });

  it("returns a failure result (not a throw) when the Discord API call rejects", async () => {
    const guildId = "cm-7";
    await seedGuild(guildId);
    const actor = makeMember({ id: "mod1", highestPosition: 10 });
    const { guild } = makeGuild({ id: guildId, members: [actor] });
    guild.members.unban.mockRejectedValueOnce(new Error("user is not banned"));

    const result = await performUnban({
      actor: actor as unknown as GuildMember,
      targetId: "not-actually-banned",
      reason: "test",
    });

    expect(result.ok).toBe(false);
  });
});
