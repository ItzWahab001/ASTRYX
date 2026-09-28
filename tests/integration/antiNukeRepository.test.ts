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
import {
  isWhitelisted,
  addToWhitelist,
  removeFromWhitelist,
  getWhitelist,
  recordIncident,
} from "../../src/repositories/antiNukeRepository.js";

async function seedGuild(guildId: string) {
  await query(`INSERT INTO guild_config (guild_id) VALUES ($1)`, [guildId]);
}

describe("antiNukeRepository (pg-mem + ioredis-mock)", () => {
  it("returns false for a user who was never whitelisted, and warms an empty cache sentinel", async () => {
    await seedGuild("g-nuke-1");
    expect(await isWhitelisted("g-nuke-1", "u1")).toBe(false);
    // Second call should hit the cache (exists=true, member=false) rather than re-querying —
    // behavior is externally identical either way, so this mainly guards against a throw.
    expect(await isWhitelisted("g-nuke-1", "u1")).toBe(false);
  });

  it("returns true once a user is added, and appears in getWhitelist", async () => {
    await seedGuild("g-nuke-2");
    await addToWhitelist("g-nuke-2", "u2", "admin-1");
    expect(await isWhitelisted("g-nuke-2", "u2")).toBe(true);
    expect(await getWhitelist("g-nuke-2")).toContain("u2");
  });

  it("returns false again after removal, and the cache is invalidated correctly", async () => {
    await seedGuild("g-nuke-3");
    await addToWhitelist("g-nuke-3", "u3", "admin-1");
    expect(await isWhitelisted("g-nuke-3", "u3")).toBe(true);

    await removeFromWhitelist("g-nuke-3", "u3");
    expect(await isWhitelisted("g-nuke-3", "u3")).toBe(false);
    expect(await getWhitelist("g-nuke-3")).not.toContain("u3");
  });

  it("adding the same user twice does not create duplicate rows (ON CONFLICT DO NOTHING)", async () => {
    await seedGuild("g-nuke-4");
    await addToWhitelist("g-nuke-4", "u4", "admin-1");
    await addToWhitelist("g-nuke-4", "u4", "admin-2");
    const rows = await query(`SELECT * FROM antinuke_whitelist WHERE guild_id = $1 AND user_id = $2`, [
      "g-nuke-4",
      "u4",
    ]);
    expect(rows.length).toBe(1);
  });

  it("records an anti-nuke incident with its detail payload", async () => {
    await seedGuild("g-nuke-5");
    await recordIncident({
      guildId: "g-nuke-5",
      actorId: "bad-actor",
      actionCount: 5,
      windowSeconds: 10,
      response: "quarantined",
      detail: { triggerDetail: "mass channel deletion" },
    });
    const rows = await query<{ response: string; action_count: number }>(
      `SELECT * FROM antinuke_incidents WHERE guild_id = $1`,
      ["g-nuke-5"],
    );
    expect(rows.length).toBe(1);
    expect(rows[0]?.response).toBe("quarantined");
    expect(rows[0]?.action_count).toBe(5);
  });
});
