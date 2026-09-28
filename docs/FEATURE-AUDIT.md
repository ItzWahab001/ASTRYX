# Meridian — Feature Audit

**This audit covers only what was built in this pass** (Core/Commands + Permissions + Moderation/AutoMod/Logs + Anti-Raid + Anti-Nuke — the first priority tier per the architecture doc's sequencing). Every other module in the target architecture (Leveling, Tickets, Economy, Music, Analytics, Backup/Restore, Automation Builder, CRM, Dashboard, Website, AI modules) is **NOT STARTED** — no code for them exists in this repo.

Scored against the six acceptance criteria: (1) real logic, (2) real API wiring, (3) persisted + restart-survives, (4) permission checks both directions, (5) error handling, (6) a passing test.

| Feature | 1. Real logic | 2. Real API wiring | 3. Persisted | 4. Permission checks | 5. Error handling | 6. Test passes | Status |
|---|---|---|---|---|---|---|---|
| Core: gateway/shard manager | Yes | Yes (discord.js Client + ShardingManager) | N/A | N/A | Yes (login failure, unhandledRejection) | No dedicated test | **PARTIAL** — untested |
| Core: slash command router | Yes | Yes | N/A | Delegates to each command | Yes (catch + ephemeral error reply) | No dedicated test | **PARTIAL** — untested |
| Permissions: canConfigure | Yes | N/A (pure) | N/A | Yes | N/A | Yes, written — **not executed** (see Test Report) | **PARTIAL** — logic complete, execution unverified |
| Permissions: canModerate | Yes | N/A (pure) | N/A | Yes, both directions (actor + bot vs target) | N/A | Yes, written — not executed | **PARTIAL** |
| Moderation: warn/mute/kick/ban commands | Yes | Yes (real timeout/kick/ban calls) | Yes (moderation_cases table) | Yes (canModerate) | Yes (try/catch, degrades to error reply) | No dedicated test (integration-shaped, not unit-testable without a live guild) | **PARTIAL** — needs integration test against a test guild |
| AutoMod: word filter | Yes | N/A (pure match) | Rule config persisted | Configure gated by canConfigure | Yes | Yes, written — not executed | **PARTIAL** |
| AutoMod: link filter | Yes | N/A (pure match) | Rule config persisted | Configure gated by canConfigure | Yes | Yes, written — not executed | **PARTIAL** |
| AutoMod: mention spam | Yes | N/A (pure match) | Rule config persisted | Configure gated by canConfigure | Yes | Yes, written — not executed | **PARTIAL** |
| AutoMod: message spam (Redis sliding window) | Yes | Yes (Redis) | Rule config persisted; counters are ephemeral by design | Configure gated by canConfigure | Yes | No test (requires live/mock Redis, not unit-pure) | **PARTIAL** |
| Moderation: escalation chain | Yes | Yes (real Discord timeout/kick/ban) | Yes (user_infractions, moderation_cases) | Runs with bot's own permissions, degrades if insufficient | Yes (degrades to warn on failure) | No dedicated test | **PARTIAL** |
| Moderation: logging pipeline | Yes | Yes (real channel.send) | Reads persisted config | N/A | Yes (missing channel/perms handled) | No dedicated test | **PARTIAL** |
| Anti-raid: heat scoring | Yes | N/A (pure) | N/A | N/A | N/A | Yes, written — not executed | **PARTIAL** — logic complete, execution unverified |
| Anti-raid: join gate (quarantine/kick) | Yes | Yes (real role add / kick) | Reads persisted config, whitelist | Whitelist-aware | Yes | No dedicated test (event-handler shaped) | **PARTIAL** |
| Anti-nuke: action monitor | Yes | Yes (real guildAuditLogEntryCreate listener) | Redis sliding window (by design ephemeral) | Whitelist-aware, ignores bot's own actions | Yes | No dedicated test | **PARTIAL** |
| Anti-nuke: quarantine (role strip / kick) | Yes | Yes (real role removal / kick) | Incident recorded (antinuke_incidents) | Role-hierarchy-checked before acting | Yes | No dedicated test | **PARTIAL** |
| Anti-nuke: whitelist | Yes | N/A | Yes (antinuke_whitelist table + Redis cache) | Configure gated by canConfigure | Yes | No dedicated test | **PARTIAL** |

## Test coverage written since last revision (still not executed)

| Feature | Now has written test | Status |
|---|---|---|
| Moderation: escalation chain | `integration/escalation.test.ts` | **PARTIAL** — pending green run |
| Moderation: manual actions + unban | `integration/caseManager.test.ts` | **PARTIAL** — pending green run |
| Moderation: logging pipeline | E2E script only (`scripts/e2e-smoke.ts`) | **PARTIAL** |
| Anti-raid: join gate | `integration/joinGate.test.ts` | **PARTIAL** — pending green run |
| Anti-nuke: action monitor / quarantine | `integration/actionMonitor.test.ts` | **PARTIAL** — pending green run |
| Anti-nuke: whitelist | `integration/antiNukeRepository.test.ts` | **PARTIAL** — pending green run |
| AutoMod: message spam | E2E only, no dedicated test | **PARTIAL** |
| Repository layer | four `integration/*Repository.test.ts` files | **PARTIAL** — pending green run |

New surface: `/unmute`, `/unban`, `/case`, `/cases`, `/config-view` (untested handlers).
Bug fixed: `env.antiRaid.heatThreshold` was never used; now wired into `evaluateJoin`.

## Why nothing is marked COMPLETE

Criterion 6 requires a test that exists **and passes**. Nothing has been executed: the authoring
environment had no network or Docker. Every test is real code, but under your own rule unexecuted
tests do not satisfy criterion 6. CI (`.github/workflows/ci.yml`) will produce the first real
result; flip rows only for what it shows green.
