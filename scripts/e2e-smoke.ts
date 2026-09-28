/**
 * End-to-end smoke test for acceptance criterion #3: "spin up the DB and Redis for real and run
 * the full flow end-to-end at least once: a message trips automod -> case gets created -> log
 * embed sends -> escalation persists."
 *
 * This talks to REAL Postgres and REAL Redis over the network (via DATABASE_URL / REDIS_URL —
 * point them at `docker-compose up` locally, or the CI job's service containers). The Discord
 * gateway/API layer is the one piece that is faked here: there is no way to safely exercise a
 * live Discord bot token + guild inside an unattended script, so `message`, `guild`, and the mod
 * log `channel` are hand-built objects that implement exactly the discord.js surface the code
 * under test actually calls (`guild.members.fetch`, `guild.channels.fetch`, `channel.send`,
 * `message.delete`, etc.) and nothing more. Everything downstream of those calls — rule lookup,
 * word-filter matching, case creation, case numbering, infraction counting, mod-log embed
 * construction — is the real, unmodified production code path, running against real infra.
 *
 * Usage:
 *   docker compose up -d
 *   cp .env.example .env   # DATABASE_URL / REDIS_URL already point at the compose services
 *   npm run migrate
 *   npm run test:e2e
 *
 * Exits 0 and prints "E2E SMOKE: PASS" on success, exits 1 and prints "E2E SMOKE: FAIL" with the
 * failing assertion otherwise. This has not been executed in this sandbox (no network/Docker) —
 * see docs/TEST-REPORT.md.
 */
import type { Guild, Message } from "discord.js";
import { pool, query } from "../src/db/postgres.js";
import { redis } from "../src/db/redis.js";
import { ensureGuildConfig, updateGuildConfig } from "../src/repositories/guildConfigRepository.js";
import { upsertRule } from "../src/repositories/automodRuleRepository.js";
import { runAutomod } from "../src/modules/moderation/automod/engine.js";

const TEST_GUILD_ID = `e2e-smoke-${Date.now()}`;
const TEST_USER_ID = "e2e-smoke-user";
const MOD_LOG_CHANNEL_ID = "e2e-smoke-mod-log";
const BOT_USER_ID = "e2e-smoke-bot";

const failures: string[] = [];
function assertTrue(condition: boolean, message: string) {
  if (!condition) failures.push(message);
}

interface FakeChannel {
  isTextBased: () => true;
  send: (payload: unknown) => Promise<{ id: string }>;
}

function buildFakeGuild(sentEmbeds: unknown[]): Guild {
  const fakeChannel: FakeChannel = {
    isTextBased: () => true,
    send: async (payload) => {
      sentEmbeds.push(payload);
      return { id: "e2e-smoke-message" };
    },
  };

  const botMember = {
    id: BOT_USER_ID,
    permissions: { has: () => true },
    roles: { highest: { position: 999 } },
  };

  const guild = {
    id: TEST_GUILD_ID,
    client: { user: { id: BOT_USER_ID } },
    members: {
      me: botMember,
      fetch: async (id: string) => (id === TEST_USER_ID ? { ...botMember, id: TEST_USER_ID } : null),
    },
    channels: {
      fetch: async (id: string) => (id === MOD_LOG_CHANNEL_ID ? fakeChannel : null),
    },
  };

  return guild as unknown as Guild;
}

async function main() {
  console.log(`[e2e-smoke] using guild_id=${TEST_GUILD_ID}`);

  // 1. Real Postgres write: seed guild config (mod log channel) + an enabled word-filter rule.
  await ensureGuildConfig(TEST_GUILD_ID);
  await updateGuildConfig(TEST_GUILD_ID, { modLogChannelId: MOD_LOG_CHANNEL_ID });
  await upsertRule(TEST_GUILD_ID, "word_filter", true, { words: ["badword"] });

  const sentEmbeds: unknown[] = [];
  const guild = buildFakeGuild(sentEmbeds);
  let messageDeleted = false;

  const message = {
    guild,
    author: { bot: false, id: TEST_USER_ID },
    content: "this message definitely contains badword in it",
    mentions: { users: { size: 0 } },
    delete: async () => {
      messageDeleted = true;
    },
  } as unknown as Message;

  // 2. The actual production pipeline: message -> automod engine -> escalation -> case ->
  // mod-log embed. No test doubles inside this call — only the Discord objects passed in are fake.
  await runAutomod(message);

  // 3. Assertions against REAL Postgres state.
  const cases = await query<{ case_number: number; action_type: string; source: string }>(
    `SELECT case_number, action_type, source FROM moderation_cases WHERE guild_id = $1`,
    [TEST_GUILD_ID],
  );
  assertTrue(cases.length === 1, `expected exactly 1 case row, got ${cases.length}`);
  assertTrue(cases[0]?.source === "automod", `expected case source 'automod', got '${cases[0]?.source}'`);
  assertTrue(
    cases[0]?.action_type === "warn",
    `expected first-infraction action 'warn', got '${cases[0]?.action_type}'`,
  );

  const infractions = await query<{ count: number }>(
    `SELECT count FROM user_infractions WHERE guild_id = $1 AND user_id = $2`,
    [TEST_GUILD_ID, TEST_USER_ID],
  );
  assertTrue(infractions[0]?.count === 1, `expected infraction count 1, got ${infractions[0]?.count}`);

  assertTrue(messageDeleted, "expected the violating message to be deleted");
  assertTrue(sentEmbeds.length === 1, `expected exactly 1 mod-log embed sent, got ${sentEmbeds.length}`);

  // 4. Cleanup — deleting guild_config cascades to every row this script created.
  await query(`DELETE FROM guild_config WHERE guild_id = $1`, [TEST_GUILD_ID]);
  await redis.del(`automod:spam:${TEST_GUILD_ID}:${TEST_USER_ID}`);
}

main()
  .catch((err) => {
    failures.push(`unhandled error: ${err instanceof Error ? err.stack ?? err.message : String(err)}`);
  })
  .finally(async () => {
    await pool.end().catch(() => undefined);
    redis.disconnect();

    if (failures.length > 0) {
      console.error("E2E SMOKE: FAIL");
      for (const f of failures) console.error(`  - ${f}`);
      process.exitCode = 1;
    } else {
      console.log("E2E SMOKE: PASS — message tripped automod, case created, mod-log embed sent, infraction persisted.");
    }
  });
