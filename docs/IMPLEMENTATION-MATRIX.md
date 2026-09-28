# Meridian — Implementation Matrix

Status legend: **COMPLETE** (all 6 acceptance criteria met, including an *executed, passing* test) · **PARTIAL** (real logic exists but fails at least one criterion) · **NOT STARTED** (no code).

## Tier 1 — built this pass

| Module | Status | Notes |
|---|---|---|
| Core/Commands (gateway, sharding, slash router) | PARTIAL | Fully wired; no executed tests yet. |
| Permissions model (configure vs. act-upon, role-hierarchy) | PARTIAL | Logic complete and unit-tested in source; tests not executed in this sandbox. |
| Moderation + AutoMod + Logs | PARTIAL | Word/link/mention/spam rules, escalation chain, case persistence, logging channel routing all implemented against real Discord + Postgres + Redis calls. |
| Anti-Raid | PARTIAL | Heat scoring (pure, unit-tested) + join gate (real quarantine/kick action) implemented. |
| Anti-Nuke + Security | PARTIAL | Real-time audit-log monitor, actor quarantine (role strip / kick), whitelist, incident logging implemented. |

## Tier 2 — not started (per sequencing: next up)

| Module | Status |
|---|---|
| Tickets + Applications + Verification | NOT STARTED |

## Tier 3 — not started

| Module | Status |
|---|---|
| Leveling + Engagement | NOT STARTED |
| Dashboard | NOT STARTED |

## Tier 4 — differentiators, not started

| Module | Status |
|---|---|
| Economy + Giveaways | NOT STARTED |
| Music + Lavalink | NOT STARTED |
| Utility + Stats + Analytics | NOT STARTED |
| Backup + Restore | NOT STARTED |
| Website | NOT STARTED |
| AI Moderation | NOT STARTED |
| AI Ticket Copilot | NOT STARTED |
| Automation Builder | NOT STARTED |
| CRM/Lifecycle | NOT STARTED |
| Cross-Server Network | NOT STARTED |
| Stripe Storefront | NOT STARTED |

## Path from PARTIAL to COMPLETE for Tier 1

Since the last revision: integration tests, docker-compose, an E2E smoke script, a CI workflow and
the missing commands (`unmute`, `unban`, `case`, `config-view`) now exist in the repo. **No row is
flipped to COMPLETE**, because none of it has been executed (no network/Docker where it was written).

1. Push to GitHub (or run locally): `npm install && npm run build && npm test`.
2. `docker compose up -d`, `npm run migrate`, `npm run test:e2e` (also run by CI's `e2e-smoke` job).
3. Fix whatever real failures appear (see risks in `docs/TEST-REPORT.md`).
4. Flip a row to COMPLETE only when its test is green in CI. Expected candidates once green:
   Permissions, Anti-Raid, Moderation + AutoMod + Logs, Anti-Nuke. Core/Commands stays PARTIAL
   until slash-handler tests exist.
