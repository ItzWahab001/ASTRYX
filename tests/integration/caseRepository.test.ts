import { describe, it, expect, vi, beforeAll } from "vitest";

// vi.mock calls are hoisted above these imports by vitest's transform, so by the time the
// static imports below resolve, "../../src/db/postgres.js" and "../../src/db/redis.js" (which
// caseRepository.ts imports internally) already resolve to the pg-mem / ioredis-mock backed
// modules built by the factories in tests/helpers.
vi.mock("../../src/db/postgres.js", async () => {
  const { createPgMemPostgresModule } = await import("../helpers/pgMemFactory.js");
  return createPgMemPostgresModule();
});
vi.mock("../../src/db/redis.js", async () => {
  const { createIoredisMockRedisModule } = await import("../helpers/ioredisMockFactory.js");
  return createIoredisMockRedisModule();
});

import { query } from "../../src/db/postgres.js";
import {
  createCase,
  getCasesForUser,
  getCase,
  incrementInfractionCount,
  getInfractionCount,
} from "../../src/repositories/caseRepository.js";

const GUILD_ID = "guild-cases-1";

beforeAll(async () => {
  await query(`INSERT INTO guild_config (guild_id) VALUES ($1)`, [GUILD_ID]);
});

describe("caseRepository (pg-mem)", () => {
  it("creates cases with sequential per-guild case numbers", async () => {
    const c1 = await createCase({
      guildId: GUILD_ID,
      targetId: "u1",
      moderatorId: "m1",
      actionType: "warn",
      source: "manual",
    });
    const c2 = await createCase({
      guildId: GUILD_ID,
      targetId: "u2",
      moderatorId: "m1",
      actionType: "mute",
      source: "automod",
    });
    expect(c1.caseNumber).toBe(1);
    expect(c2.caseNumber).toBe(2);
  });

  it("retrieves cases for a specific user, newest first", async () => {
    await createCase({ guildId: GUILD_ID, targetId: "u3", moderatorId: "m1", actionType: "warn", source: "manual" });
    await createCase({
      guildId: GUILD_ID,
      targetId: "u3",
      moderatorId: "m1",
      actionType: "kick",
      source: "manual",
      reason: "second infraction",
    });
    const cases = await getCasesForUser(GUILD_ID, "u3");
    expect(cases.length).toBe(2);
    expect(cases[0]?.actionType).toBe("kick");
    expect(cases[1]?.actionType).toBe("warn");
  });

  it("retrieves a single case by case number, and null for one that doesn't exist", async () => {
    const created = await createCase({
      guildId: GUILD_ID,
      targetId: "u4",
      moderatorId: "m1",
      actionType: "ban",
      source: "manual",
    });
    const found = await getCase(GUILD_ID, created.caseNumber);
    expect(found?.targetId).toBe("u4");
    expect(await getCase(GUILD_ID, 999_999)).toBeNull();
  });

  it("increments infraction counts per guild/user and reads them back", async () => {
    expect(await getInfractionCount(GUILD_ID, "u5")).toBe(0);
    expect(await incrementInfractionCount(GUILD_ID, "u5")).toBe(1);
    expect(await incrementInfractionCount(GUILD_ID, "u5")).toBe(2);
    expect(await getInfractionCount(GUILD_ID, "u5")).toBe(2);
    // A different user in the same guild has an independent counter.
    expect(await getInfractionCount(GUILD_ID, "u6")).toBe(0);
  });
});
