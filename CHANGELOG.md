# Changelog

## 2.3.3 — Dashboard safety patch
- Fixed dashboard boolean parsing so form/API values such as `false` and `0` cannot accidentally enable controls.
- Added batch rollback for dashboard AutoMod enable/disable if a later rule update fails.
- Added regression coverage for boolean parsing.


## 2.3.1 — Final engineering pass
- Help catalog now derives command discovery from the real command registry and covers nested AutoMod subcommands.
- Dashboard sections are explicitly classified as monitoring-only or control surfaces; only Settings exposes mutations.
- Dashboard resource IDs are validated against the current Discord guild and expected channel/role type.
- Startup now waits for Discord login/ready initialization before starting the dashboard and uses one fatal shutdown path.
- Graceful Music shutdown preserves persistent queue/history/configuration instead of clearing the queue.
- Native AutoMod exemption and enable/disable persistence failures now attempt rollback.
- Added Help, dashboard-section, dashboard-resource, and credential/static audit tests.
- Added FINAL-ENGINEERING-AUDIT.md with exact verification boundaries.

## 2.0.0
- Rebuilt the project around core/commands/services/repositories/database/cache/scheduler layers.
- Added centralized command middleware and centralized interaction error handling.
- Added persistent moderation cases and warnings.
- Added Discord AutoMod rule management.
- Added sliding-window anti-raid signals and audit-log anti-nuke protection.
- Rebuilt tickets with persistent lifecycle, transcripts, notes, priority, rating and recovery.
- Added per-guild music state and voice controls.
- Added atomic economy transfers and transaction history.
- Added restart-safe giveaway recovery.
- Added verification and autorole systems.
- Added AI chat and AI teacher service safeguards.
- Added OAuth2 dashboard security controls and resource selectors.
- Added health/metrics endpoints, graceful shutdown, tests and CI.

## Final production pass
- Added persisted music queue/history recovery state and bounded player operations.
- Added best-effort security resource snapshots and recovery for deleted channels/roles.
- Added anti-raid join/leave burst risk scoring and automatic raid-mode recovery.
- Hardened native Discord AutoMod rule validation and management, including correct regex metadata on the Keyword trigger type.
- Added security panel modals for whitelist and per-action thresholds.
- Hardened dashboard authorization refresh, OAuth token refresh, request IDs, live overview metrics and validated settings input.
- Reworked ticket close/reopen/claim paths for state-race protection and full paginated transcript collection up to a safety cap.


## 2.3.2 engineering patch
- Added real dashboard control APIs for native AutoMod enable/disable and security Anti-Raid/Anti-Nuke toggles.
- Added dashboard lockdown/unlock controls backed by the existing security service.
- Added CSRF-protected dashboard control tests and marked these sections as control-capable.

## 2.3.4 — Lockdown restore fix (Claude review pass)
- `security.lockdown()`/`security.unlock()` now snapshot whether `@everyone` had an explicit SendMessages allow-overwrite before locking a channel, and restore that exact state on unlock instead of blindly clearing the overwrite. Previously, channels with a pre-existing explicit allow overwrite lost that explicit allow and fell back to inherited permissions after unlock.
- `/antinuke-lockdown` now delegates to the same `security.lockdown`/`security.unlock` logic used by the dashboard and `/security-panel`, instead of a separate, simpler implementation that had the same restore bug and no persistence.
- Added `had_explicit_allow` column to `security_lockdown_channels` (schema + migration) to support the fix.
