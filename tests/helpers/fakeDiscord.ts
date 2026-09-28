import { vi } from "vitest";
import { FakeCollection } from "./fakeCollection.js";

export interface FakeRole {
  id: string;
  position: number;
  editable: boolean;
}

export interface FakeMemberOptions {
  id: string;
  ownerId?: string;
  highestPosition?: number;
  isBot?: boolean;
  hasPermission?: boolean;
  roles?: FakeRole[];
}

/**
 * A hand-built stand-in for discord.js's `GuildMember`, implementing only what the source under
 * test actually touches: `.id`, `.user.bot`, `.permissions.has()`, `.roles.{highest,cache}`,
 * `.guild.ownerId`, and the mutating action methods (`.timeout`, `.kick`) as vi.fn() spies so
 * tests can assert real API calls were (or weren't) made.
 */
export function makeMember(opts: FakeMemberOptions) {
  const roleCollection = new FakeCollection<string, FakeRole>();
  for (const role of opts.roles ?? []) roleCollection.set(role.id, role);

  // `guild` starts as a lightweight stub (enough for permission checks that only read
  // `.ownerId`) and is mutated in place by makeGuild() to point at the real fake guild object
  // once one is constructed around this member — see makeGuild below.
  return {
    id: opts.id,
    user: { id: opts.id, bot: opts.isBot ?? false },
    permissions: { has: vi.fn(() => opts.hasPermission ?? true) },
    roles: {
      highest: { position: opts.highestPosition ?? 1 },
      cache: roleCollection,
      add: vi.fn(async () => undefined),
      remove: vi.fn(async (role: FakeRole) => role),
    },
    guild: { ownerId: opts.ownerId ?? "owner-1" } as unknown,
    timeout: vi.fn(async () => undefined),
    kick: vi.fn(async () => undefined),
  };
}

export type FakeMember = ReturnType<typeof makeMember>;

export interface FakeGuildOptions {
  id: string;
  ownerId?: string;
  botMember?: FakeMember;
  members?: FakeMember[];
  modLogChannelId?: string | null;
}

/**
 * A hand-built stand-in for discord.js's `Guild`. Implements `members.fetch/ban/unban/me`,
 * `channels.fetch`, and `client.user` — the exact surface escalation.ts, caseManager.ts,
 * quarantine.ts, joinGate.ts and logging.ts call. `sentEmbeds` captures anything sent to the mod
 * log channel so tests can assert on it without a real Discord connection.
 */
export function makeGuild(opts: FakeGuildOptions) {
  const membersById = new Map<string, FakeMember>();
  for (const m of opts.members ?? []) membersById.set(m.id, m);

  const botMember = opts.botMember ?? makeMember({ id: "bot-1", highestPosition: 999 });
  const sentEmbeds: unknown[] = [];
  const allMembers = [botMember, ...membersById.values()];

  const fakeChannel = {
    isTextBased: () => true as const,
    send: vi.fn(async (payload: unknown) => {
      sentEmbeds.push(payload);
      return { id: "fake-message-1" };
    }),
  };

  const guild = {
    id: opts.id,
    ownerId: opts.ownerId ?? "owner-1",
    client: { user: { id: botMember.id } },
    members: {
      me: botMember,
      fetch: vi.fn(async (id: string) => membersById.get(id) ?? null),
      ban: vi.fn(async () => undefined),
      unban: vi.fn(async () => undefined),
    },
    channels: {
      fetch: vi.fn(async (id: string) => (opts.modLogChannelId && id === opts.modLogChannelId ? fakeChannel : null)),
    },
  };

  // Point every member (including the bot itself) at this real fake guild object, so code like
  // caseManager.ts's `const guild: Guild = actor.guild` gets a fully functional guild, not the
  // lightweight `{ownerId}` stub makeMember() creates on its own.
  for (const member of allMembers) member.guild = guild;

  return { guild, botMember, membersById, sentEmbeds, fakeChannel };
}
