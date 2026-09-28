# Meridian — Test Report

**Status: still NOT EXECUTED.** The environment this work was done in has no network egress
(`npm install` returns `403 Forbidden`, no offline cache) and no Docker. So `tsc`, `vitest`,
docker-compose and the E2E script have **never been run**. There is no pass/fail output below
because none exists; inventing it would defeat the point of this file.

What changed since the last version: the suite is much larger, CI now exists to run it, and a
one-command real-infra smoke test exists. The first CI run on GitHub is the first real result.

## Suite inventory (all written, none executed)

| File | Covers | Backend |
|---|---|---|
| `tests/heatScoring.test.ts` | `scoreJoin` (incl. new configurable thresholds), `looksGenerated` | pure |
| `tests/automodRules.test.ts` | word / link / mention rules | pure |
| `tests/permissions.test.ts` | `canConfigure`, `canModerate`, `botOutranksManagedRoles` | hand-built member mocks |
| `tests/integration/caseRepository.test.ts` | case numbering, history, lookup, infraction counters | pg-mem |
| `tests/integration/guildConfigRepository.test.ts` | ensure/get/update, Redis cache, COALESCE patch semantics | pg-mem + ioredis-mock |
| `tests/integration/automodRuleRepository.test.ts` | upsert, cache invalidation | pg-mem + ioredis-mock |
| `tests/integration/antiNukeRepository.test.ts` | whitelist add/remove/list/cache, incident logging | pg-mem + ioredis-mock |
| `tests/integration/escalation.test.ts` | `applyEscalation`: warn, mute at threshold, permission/left-guild degrade, chain cap | pg-mem + ioredis-mock + fake discord.js |
| `tests/integration/caseManager.test.ts` | `performManualAction`, new `performUnban` | pg-mem + fake discord.js |
| `tests/integration/joinGate.test.ts` | `evaluateJoin`: allow, quarantine role, kick fallback, whitelist, velocity | pg-mem + ioredis-mock + fake discord.js |
| `tests/integration/actionMonitor.test.ts` | `handleAuditLogEntry`, `quarantineActor` (bot kick, role strip, logged_only) | pg-mem + ioredis-mock + fake discord.js |
| `scripts/e2e-smoke.ts` | message -> automod -> case -> log embed -> escalation persisted | REAL Postgres + Redis; only Discord objects faked |

## Known risks a real run may surface

- **pg-mem fidelity**: the schema uses `TEXT[]`, `JSONB`, `ON CONFLICT`, `FOR UPDATE`. pg-mem
  supports most of these but this was not verified. If a repository test fails on SQL support,
  that is a pg-mem limitation to weigh against running the same tests on real Postgres.
- **TypeScript**: `tsconfig` includes `src`, `tests` and `scripts`, so test typing errors fail
  `npm run build`. Code was reviewed by hand against `strict` + `noUncheckedIndexedAccess`, not compiled.
- **Test hoisting**: tests rely on `vi.mock` hoisting to swap `src/db/postgres.js` / `redis.js`.
- The Discord layer in the E2E is faked by design (no live bot token in an unattended script).

## Not covered

`checkMessageSpam` (Redis sliding window, unit level), `runAutomod` engine in isolation (covered
only by the E2E script), slash-command `execute` handlers (`unban`, `case`, `config-view`, etc.),
`guildMemberAdd`/`messageCreate` event wiring.

## To produce the real report

```
npm install
npm run build
npm test
docker compose up -d && cp .env.example .env && npm run migrate && npm run test:e2e
```
Or push to GitHub: `.github/workflows/ci.yml` runs build, tests and the E2E against service
containers. Paste real output here, then flip matrix rows only for what is green.
