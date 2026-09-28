import { describe, it, expect, vi } from "vitest";

vi.mock("../../src/db/postgres.js", async () => {
  const { createPgMemPostgresModule } = await import("../helpers/pgMemFactory.js");
  return createPgMemPostgresModule();
});
vi.mock("../../src/db/redis.js", async () => {
  const { createIoredisMockRedisModule } = await import("../helpers/ioredisMockFactory.js");
  return createIoredisMockRedisModule();
});

import { redis } from "../../src/db/redis.js";
import { ensureGuildConfig, getGuildConfig, updateGuildConfig } from "../../src/repositories/guildConfigRepository.js";

describe("guildConfigRepository (pg-mem + ioredis-mock)", () => {
  it("creates a default config on first ensure, idempotently on repeated calls", async () => {
    const first = await ensureGuildConfig("g-config-1");
    expect(first.escalationChain).toEqual(["warn", "mute", "kick", "ban"]);
    expect(first.escalationThreshold).toBe(3);

    const second = await ensureGuildConfig("g-config-1");
    expect(second.guildId).toBe(first.guildId);
    expect(second.escalationThreshold).toBe(3);
  });

  it("warms the redis cache on ensure, and getGuildConfig serves from it", async () => {
    await ensureGuildConfig("g-config-2");
    const cached = await redis.get("guildconfig:g-config-2");
    expect(cached).not.toBeNull();

    const fromCache = await getGuildConfig("g-config-2");
    expect(fromCache.guildId).toBe("g-config-2");
  });

  it("getGuildConfig lazily creates config (and its row) on a cold cache", async () => {
    const config = await getGuildConfig("g-config-3-cold");
    expect(config.guildId).toBe("g-config-3-cold");
    expect(config.adminRoleIds).toEqual([]);
  });

  it("updateGuildConfig persists a patch to Postgres and refreshes the cache", async () => {
    await ensureGuildConfig("g-config-4");
    const updated = await updateGuildConfig("g-config-4", {
      modLogChannelId: "chan-1",
      escalationThreshold: 5,
    });
    expect(updated.modLogChannelId).toBe("chan-1");
    expect(updated.escalationThreshold).toBe(5);

    // Bust our local assumption and re-read purely from the (now-refreshed) cache.
    const reread = await getGuildConfig("g-config-4");
    expect(reread.modLogChannelId).toBe("chan-1");
    expect(reread.escalationThreshold).toBe(5);
  });

  it("leaves fields untouched when a patch omits them (COALESCE semantics)", async () => {
    await ensureGuildConfig("g-config-5");
    await updateGuildConfig("g-config-5", { modLogChannelId: "chan-keep" });
    const after = await updateGuildConfig("g-config-5", { escalationThreshold: 7 });
    expect(after.modLogChannelId).toBe("chan-keep");
    expect(after.escalationThreshold).toBe(7);
  });
});
