import { describe, it, expect, vi } from "vitest";
import { AuditLogEvent } from "discord.js";
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
import { handleAuditLogEntry } from "../../src/modules/antiNuke/actionMonitor.js";
import { quarantineActor } from "../../src/modules/antiNuke/quarantine.js";
import { addToWhitelist } from "../../src/repositories/antiNukeRepository.js";
import { makeGuild, makeMember } from "../helpers/fakeDiscord.js";

async function seedGuild(guildId: string) {
  await query(`INSERT INTO guild_config (guild_id) VALUES ($1)`, [guildId]);
}

describe("handleAuditLogEntry (pg-mem + ioredis-mock + fake discord.js)", () => {
  it("does nothing below the configured action threshold (default 3 within the window)", async () => {
    const guildId = "am-1";
    await seedGuild(guildId);
    const actor = makeMember({ id: "actor-1", highestPosition: 5 });
    const botMember = makeMember({ id: "bot-1", highestPosition: 999 });
    const { guild } = makeGuild({ id: guildId, members: [actor], botMember });

    // Two channel deletions — below the default threshold of 3 — should not trigger containment.
    await handleAuditLogEntry(guild as unknown as Guild, AuditLogEvent.ChannelDelete, "actor-1");
    await handleAuditLogEntry(guild as unknown as Guild, AuditLogEvent.ChannelDelete, "actor-1");

    expect(actor.roles.remove).not.toHaveBeenCalled();
    expect(actor.kick).not.toHaveBeenCalled();
  });

  it("quarantines (strips roles from) an actor who crosses the action threshold", async () => {
    const guildId = "am-2";
    await seedGuild(guildId);
    const actor = makeMember({
      id: "actor-2",
      highestPosition: 5,
      roles: [{ id: "r1", position: 3, editable: true }],
    });
    const botMember = makeMember({ id: "bot-1", highestPosition: 999 });
    const { guild } = makeGuild({ id: guildId, members: [actor], botMember });

    for (let i = 0; i < 3; i++) {
      await handleAuditLogEntry(guild as unknown as Guild, AuditLogEvent.ChannelDelete, "actor-2");
    }

    expect(actor.roles.remove).toHaveBeenCalled();
    const incidents = await query(`SELECT * FROM antinuke_incidents WHERE guild_id = $1`, [guildId]);
    expect(incidents.length).toBe(1);
  });

  it("ignores actions performed by the bot itself", async () => {
    const guildId = "am-3";
    await seedGuild(guildId);
    const botMember = makeMember({ id: "bot-self", highestPosition: 999 });
    const { guild } = makeGuild({ id: guildId, botMember });

    for (let i = 0; i < 5; i++) {
      await handleAuditLogEntry(guild as unknown as Guild, AuditLogEvent.ChannelDelete, "bot-self");
    }

    const incidents = await query(`SELECT * FROM antinuke_incidents WHERE guild_id = $1`, [guildId]);
    expect(incidents.length).toBe(0);
  });

  it("never quarantines a whitelisted actor, regardless of action count", async () => {
    const guildId = "am-4";
    await seedGuild(guildId);
    await addToWhitelist(guildId, "trusted-admin", "owner-1");
    const actor = makeMember({ id: "trusted-admin", highestPosition: 5 });
    const botMember = makeMember({ id: "bot-1", highestPosition: 999 });
    const { guild } = makeGuild({ id: guildId, members: [actor], botMember });

    for (let i = 0; i < 5; i++) {
      await handleAuditLogEntry(guild as unknown as Guild, AuditLogEvent.RoleDelete, "trusted-admin");
    }

    expect(actor.roles.remove).not.toHaveBeenCalled();
    const incidents = await query(`SELECT * FROM antinuke_incidents WHERE guild_id = $1`, [guildId]);
    expect(incidents.length).toBe(0);
  });

  it("ignores audit log events outside the monitored set", async () => {
    const guildId = "am-5";
    await seedGuild(guildId);
    const actor = makeMember({ id: "actor-5", highestPosition: 5 });
    const botMember = makeMember({ id: "bot-1", highestPosition: 999 });
    const { guild } = makeGuild({ id: guildId, members: [actor], botMember });

    // MemberUpdate is not in actionMonitor's MONITORED_EVENTS set.
    for (let i = 0; i < 10; i++) {
      await handleAuditLogEntry(guild as unknown as Guild, AuditLogEvent.MemberUpdate, "actor-5");
    }

    const incidents = await query(`SELECT * FROM antinuke_incidents WHERE guild_id = $1`, [guildId]);
    expect(incidents.length).toBe(0);
  });
});

describe("quarantineActor (pg-mem + fake discord.js)", () => {
  it("kicks a bot actor rather than stripping its roles", async () => {
    const guildId = "qa-1";
    await seedGuild(guildId);
    const botActor = makeMember({ id: "rogue-bot", highestPosition: 5, isBot: true });
    const botMember = makeMember({ id: "bot-1", highestPosition: 999 });
    const { guild } = makeGuild({ id: guildId, members: [botActor], botMember });

    const response = await quarantineActor({
      guild: guild as unknown as Guild,
      actorId: "rogue-bot",
      actionCount: 5,
      windowSeconds: 10,
      triggerDetail: "rapid unauthorized bot additions",
    });

    expect(response).toBe("kicked");
    expect(botActor.kick).toHaveBeenCalledTimes(1);
    expect(botActor.roles.remove).not.toHaveBeenCalled();
  });

  it("strips roles from a human actor when the bot can manage roles and outranks them", async () => {
    const guildId = "qa-2";
    await seedGuild(guildId);
    const actor = makeMember({
      id: "human-actor",
      highestPosition: 5,
      roles: [
        { id: "r1", position: 3, editable: true },
        { id: "r2", position: 4, editable: true },
      ],
    });
    const botMember = makeMember({ id: "bot-1", highestPosition: 999 });
    const { guild } = makeGuild({ id: guildId, members: [actor], botMember });

    const response = await quarantineActor({
      guild: guild as unknown as Guild,
      actorId: "human-actor",
      actionCount: 4,
      windowSeconds: 10,
      triggerDetail: "mass channel deletion",
    });

    expect(response).toBe("quarantined");
    expect(actor.kick).not.toHaveBeenCalled();
    expect(actor.roles.remove).toHaveBeenCalledTimes(2);
  });

  it("falls back to logged_only when the bot cannot outrank/manage the actor's roles", async () => {
    const guildId = "qa-3";
    await seedGuild(guildId);
    const actor = makeMember({
      id: "unreachable-actor",
      highestPosition: 500, // outranks the bot
      roles: [{ id: "r1", position: 3, editable: true }],
    });
    const botMember = makeMember({ id: "bot-1", highestPosition: 10 });
    const { guild } = makeGuild({ id: guildId, members: [actor], botMember });

    const response = await quarantineActor({
      guild: guild as unknown as Guild,
      actorId: "unreachable-actor",
      actionCount: 4,
      windowSeconds: 10,
      triggerDetail: "mass role deletion",
    });

    expect(response).toBe("logged_only");
    expect(actor.roles.remove).not.toHaveBeenCalled();
    const incidents = await query<{ response: string }>(`SELECT * FROM antinuke_incidents WHERE guild_id = $1`, [
      guildId,
    ]);
    expect(incidents[0]?.response).toBe("logged_only");
  });
});
