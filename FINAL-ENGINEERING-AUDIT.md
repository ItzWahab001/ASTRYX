# DYNEX Final Engineering Audit — 2.3.1

Date: 2026-09-23

This pass modified the existing DYNEX architecture only. No rebuild, fake commands, placeholder APIs, or feature-count expansion was used.

## Verified locally

- `npm test`: **30 passed / 0 failed / 0 skipped**.
- `npm run audit`: **pass**; static command audit reports 91 command modules and the same 30 tests pass.
- `npm run check`: **pass**.
- `npm run syntax`: **pass** for all JavaScript files under `src`.
- Local relative-require audit: **0 broken imports**.
- Duplicate top-level command-name audit: **0 duplicates**.
- Placeholder/credential static tests: **pass**.
- Help completeness tests: **pass**.
- Dashboard authorization/resource-validation tests: **pass**.
- AutoMod native regex mapping test: **pass**.
- Anti-Raid risk tests: **pass**.
- Recovery-policy safety tests: **pass**.
- Music mutex/queue isolation tests: **pass**.

## Help system

The Help system now derives its entries from the live command registry. Nested command/subcommand definitions are flattened for discovery. A test verifies that every real top-level command represented by the command modules is present in the generated catalog, and nested AutoMod commands are tested separately.

No Help entry is allowed to point to a command that is absent from the supplied registry.

## Dashboard

All advertised dashboard sections remain available. Only **Settings** is presented as a mutation/control surface in this release. The other sections are explicitly marked **Monitoring Only** because they do not currently expose dedicated backend mutation APIs.

Settings mutations validate the authenticated guild access server-side and additionally validate submitted channel/category/role IDs against the current Discord guild. The browser is not trusted for guild/resource ownership.

## AutoMod

Native Discord AutoMod remains the enforcement mechanism. Regex is mapped to the supported Keyword trigger with `regexPatterns`. Persistence failures after remote changes attempt a rollback rather than returning a false success.

## Security / recovery

Deleted channel/role recovery remains best-effort and safety-first. Dangerous role permissions are stripped, role positions are clamped below the bot hierarchy, and channel overwrites are restricted to the `@everyone` role and currently existing role IDs. Recovery has an in-process lock and persistent restored-state marker to prevent duplicate recreation.

Owner/trusted-user/trusted-role protections and bot/hierarchy checks remain in place.

## Anti-Raid

Sliding join/leave state remains bounded through TTL caches. Risk combines configurable join threshold/window, account age, username similarity, and leave-burst signals. RAID MODE is persisted and automatically recovered after its expiry.

## Music

The existing MusicManager/GuildPlayer/QueueManager architecture remains intact. A shutdown-specific player cleanup path now preserves the persistent queue/history/configuration instead of invoking the user-facing `stop()` behavior that clears the queue.

This does **not** claim playback-position recovery after process restart. The currently playing track is not automatically resumed after restart; persisted upcoming queue/history/configuration are the recoverable state.

## Startup / shutdown

Discord login is awaited before the dashboard starts. Fatal login/ready initialization failures are logged and terminate startup instead of leaving a dashboard server running as if the bot were healthy.

SIGINT, SIGTERM, uncaught exceptions, and unhandled promise rejections enter the common shutdown path. Background recovery/giveaway timers, music players, Discord client, dashboard server, and database are cleaned up.

## Dependencies / reproducible builds

`package.json` is pinned to exact dependency versions and targets Node `>=20`. Docker installs FFmpeg and the Node runtime image is Node 20.

**NOT VERIFIED:** a real `package-lock.json` could not be generated because npm registry access timed out in this environment. No lockfile was fabricated. Therefore `npm ci` correctly fails until a real lockfile is generated externally.

## Docker / CI

**NOT VERIFIED:** Docker build; Docker CLI is unavailable in the current environment.

CI configuration uses `npm install` rather than `npm ci` because no lockfile exists. This is deliberate and documented; switching to `npm ci` without a genuine lockfile would make CI fail immediately.

## Real Discord verification

**NOT VERIFIED.** No live Discord test server/token was available in this execution environment.

The guarded integration checker is available at `npm run integration:discord` and refuses to run unless `DYNEX_INTEGRATION=1` is explicitly set. It can verify bot identity, application identity, registered global commands, guild access, AutoMod visibility, and audit-log readability when real credentials are supplied.

The integration checker does not claim slash-command execution, voice playback, OAuth browser flow, or full dashboard browser verification.

## Lint

**NOT VERIFIED:** `npm run lint` could not execute because dependencies are not installed and the environment cannot reach npm to install them.

## Known limitations

1. No generated `package-lock.json` in the final archive because registry access was unavailable.
2. No live Discord verification.
3. No Docker build verification.
4. No live PostgreSQL verification; SQLite remains the supported runtime.
5. Music restart recovery restores persistent queue/history/configuration but does not resume the exact in-progress track/position.
6. Dashboard subsystem pages other than Settings are intentionally monitoring-only rather than pretending to provide controls without backend mutation APIs.
