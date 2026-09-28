import { describe, it, expect } from "vitest";
import { canConfigure, canModerate, botOutranksManagedRoles } from "../src/core/permissions.js";
import type { GuildConfig } from "../src/repositories/guildConfigRepository.js";
import type { GuildMember } from "discord.js";

const PERM_MODERATE = 1n << 40n; // placeholder bit value, only used for mock .has() equality checks below

function fakeConfig(overrides: Partial<GuildConfig> = {}): GuildConfig {
  return {
    guildId: "g1",
    adminRoleIds: [],
    modLogChannelId: null,
    joinLogChannelId: null,
    quarantineRoleId: null,
    escalationChain: ["warn", "mute", "kick", "ban"],
    escalationThreshold: 3,
    ...overrides,
  };
}

function fakeMember(opts: {
  id: string;
  highestPosition: number;
  hasPermission?: boolean;
  roleIds?: string[];
  ownerId?: string;
}): GuildMember {
  return {
    id: opts.id,
    permissions: { has: () => opts.hasPermission ?? true },
    roles: {
      highest: { position: opts.highestPosition },
      cache: { some: (fn: (r: { id: string }) => boolean) => (opts.roleIds ?? []).some((id) => fn({ id })) },
    },
    guild: { ownerId: opts.ownerId ?? "owner1" },
  } as unknown as GuildMember;
}

describe("canConfigure", () => {
  it("allows a member with ManageGuild", () => {
    const member = fakeMember({ id: "m1", highestPosition: 1, hasPermission: true });
    expect(canConfigure(member, fakeConfig()).allowed).toBe(true);
  });

  it("allows a member holding a configured admin role even without ManageGuild", () => {
    const member = fakeMember({ id: "m1", highestPosition: 1, hasPermission: false, roleIds: ["adminRole"] });
    expect(canConfigure(member, fakeConfig({ adminRoleIds: ["adminRole"] })).allowed).toBe(true);
  });

  it("denies a member with neither", () => {
    const member = fakeMember({ id: "m1", highestPosition: 1, hasPermission: false, roleIds: [] });
    expect(canConfigure(member, fakeConfig()).allowed).toBe(false);
  });
});

describe("canModerate", () => {
  it("denies moderating the server owner", () => {
    const actor = fakeMember({ id: "mod1", highestPosition: 10, ownerId: "target1" });
    const target = fakeMember({ id: "target1", highestPosition: 5, ownerId: "target1" });
    const bot = fakeMember({ id: "bot1", highestPosition: 20 });
    expect(canModerate(actor, target, bot, PERM_MODERATE).allowed).toBe(false);
  });

  it("denies when actor's highest role does not outrank target's", () => {
    const actor = fakeMember({ id: "mod1", highestPosition: 3 });
    const target = fakeMember({ id: "target1", highestPosition: 5 });
    const bot = fakeMember({ id: "bot1", highestPosition: 20 });
    const result = canModerate(actor, target, bot, PERM_MODERATE);
    expect(result.allowed).toBe(false);
    expect(result.reason).toMatch(/highest role/i);
  });

  it("denies when the bot itself does not outrank the target", () => {
    const actor = fakeMember({ id: "mod1", highestPosition: 10 });
    const target = fakeMember({ id: "target1", highestPosition: 5 });
    const bot = fakeMember({ id: "bot1", highestPosition: 4 });
    const result = canModerate(actor, target, bot, PERM_MODERATE);
    expect(result.allowed).toBe(false);
    expect(result.reason).toMatch(/Meridian's role/i);
  });

  it("allows when actor and bot both outrank the target and hold the permission", () => {
    const actor = fakeMember({ id: "mod1", highestPosition: 10, hasPermission: true });
    const target = fakeMember({ id: "target1", highestPosition: 5 });
    const bot = fakeMember({ id: "bot1", highestPosition: 20, hasPermission: true });
    expect(canModerate(actor, target, bot, PERM_MODERATE).allowed).toBe(true);
  });
});

describe("botOutranksManagedRoles", () => {
  it("flags managed roles at or above the bot's highest role", () => {
    const bot = {
      roles: { highest: { position: 5 } },
      guild: { roles: { cache: new Map([["r1", { position: 6 }], ["r2", { position: 2 }]]) } },
    } as unknown as GuildMember;
    const result = botOutranksManagedRoles(bot, ["r1", "r2"]);
    expect(result.allowed).toBe(false);
    expect(result.reason).toMatch(/1 managed role/i);
  });

  it("allows when the bot outranks every managed role", () => {
    const bot = {
      roles: { highest: { position: 10 } },
      guild: { roles: { cache: new Map([["r1", { position: 6 }], ["r2", { position: 2 }]]) } },
    } as unknown as GuildMember;
    expect(botOutranksManagedRoles(bot, ["r1", "r2"]).allowed).toBe(true);
  });
});
