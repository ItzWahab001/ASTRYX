# Meridian

Unified Discord moderation, anti-raid/anti-nuke security, engagement, tickets and analytics bot —
built against the target architecture in `MERIDIAN-RESEARCH-AND-ARCHITECTURE.md`.

**This is Tier 1 only**: Core/Commands, Permissions, Moderation + AutoMod + Logs, and
Anti-Raid/Anti-Nuke + Security — the first priority group per that doc's sequencing. Every other
module (Tickets, Leveling, Economy, Music, Analytics, Backup/Restore, Dashboard, Website, AI
modules, Automation Builder, CRM, Cross-Server Network, Stripe billing) is genuinely not started.
See `docs/IMPLEMENTATION-MATRIX.md` for the honest per-module status and `docs/FEATURE-AUDIT.md`
for the per-feature, per-criterion breakdown.

## Stack

Node.js 20+, TypeScript, discord.js v14, PostgreSQL (durable state), Redis (cache + sliding-window
counters for automod/anti-raid/anti-nuke rate detection).

## Setup

```bash
npm install
cp .env.example .env   # fill in DISCORD_TOKEN, DISCORD_CLIENT_ID, DATABASE_URL, REDIS_URL
npm run build
npm run migrate         # applies src/db/migrations/001_init.sql
node dist/deployCommands.js   # registers slash commands with Discord
npm start                # spawns shards, launches the bot
```

For local development without building: `npm run dev` (runs `src/bot.ts` directly via tsx, single
process, no sharding — fine for a dev/test guild).

## Testing

```bash
npm test
```

Pure logic (heat scoring, automod rule matching, permission hierarchy checks) has real unit tests
in `tests/`. They have **not been executed** in the sandbox this was built in — no network access
to install dependencies. Run them yourself and see `docs/TEST-REPORT.md` for what's covered and
what isn't yet (Discord-API-calling code paths have no tests yet; see that file).

## What's actually wired up

- **Permissions** (`src/core/permissions.ts`): separates "who can configure the bot"
  (`canConfigure`) from "who the bot can act upon" (`canModerate`, role-hierarchy-aware in both
  directions — actor vs. target, and bot vs. target).
- **AutoMod** (`src/modules/moderation/automod/`): word filter, link allowlist, mention-spam, and
  Redis-backed message-rate rules, each configurable per guild via `/config-automod`.
- **Escalation** (`src/modules/moderation/escalation.ts`): configurable warn→mute→kick→ban chain,
  degrades gracefully (falls back to warn + logs) on permission or rate-limit failure instead of
  throwing.
- **Anti-raid** (`src/modules/antiRaid/`): heat-based join scoring (account age, avatar, username
  pattern, join velocity) — quarantines or kicks above threshold, whitelist-aware.
- **Anti-nuke** (`src/modules/antiNuke/`): real-time audit-log monitoring for mass
  channel/role deletion, mass bans, webhook creation, and bot additions; strips the offending
  actor's roles (or kicks if it's a bot) once their action rate crosses the configured threshold
  within the configured window; whitelist-aware; every incident is recorded and logged.
- **Cases + logging**: every action — manual or automated — gets a per-guild sequential case
  number in Postgres and an embed in the guild's configured mod-log channel.

## Known gaps in this pass (tracked, not hidden)

- No test has been executed against a live Discord/Postgres/Redis stack — see `docs/TEST-REPORT.md`.
- Anti-nuke quarantine strips roles / kicks the actor; it does **not** attempt structural restore
  (recreating deleted channels/roles) — that's Xenon-style backup/restore, explicitly out of scope
  for this tier per the architecture doc.
- Commands: warn, mute, unmute, kick, ban, unban, cases (history), case (lookup by number),
  config-automod, antinuke-whitelist, config-view (read current settings). Still no
  appeals, note/edit-reason, or bulk tools.
- Local infra: `docker compose up -d`. Tests: `npm test`. Real-infra smoke: `npm run test:e2e`.
  CI runs build + tests + E2E on every push. None of this has been executed yet; see docs/TEST-REPORT.md.
