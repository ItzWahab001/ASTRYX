# DYNEX 2.3.2 — Final Engineering Patch

## Implemented

- Added real dashboard control APIs backed by the existing services.
- AutoMod dashboard enable/disable now updates native Discord AutoMod rules through `src/services/automod.js` and persists the guild setting.
- Security dashboard now exposes real Anti-Raid and Anti-Nuke toggles through the existing guild repository.
- Security dashboard now exposes real lockdown/unlock actions through `src/services/security.js`.
- All new mutation routes require authentication, fresh Discord guild permission validation, valid guild membership, and CSRF.
- Dashboard control actions are written to `dashboard_audit`.
- Dashboard sections for AutoMod, Security, Anti-Raid and Anti-Nuke are now explicitly marked as control surfaces.
- Added regression tests for the new control APIs and UI wiring.
- Updated the existing dashboard-section test so it reflects the new honest control/monitoring split.
- Updated package version to 2.3.2.

## Verification performed in this environment

- JavaScript syntax check: PASS for all `src/**/*.js`.
- `npm test`: 34 passed, 0 failed, 0 skipped.
- No live Discord server was available, so actual Discord OAuth, AutoMod mutations, security lockdown behavior, and voice playback were NOT live-verified.
- Docker build was NOT run because the environment does not provide the Docker CLI.
- `package-lock.json` was NOT generated because the package registry/cache is unavailable in this environment. It was deliberately not fabricated.

## Remaining genuine deployment step

On a machine with npm registry access:

    npm install --package-lock-only
    npm ci
    npm test
    npm run check
    npm run lint

Then perform a real Discord test-server pass for the dashboard control endpoints.

## Important

This release does not claim full dashboard control for every DYNEX subsystem. Sections without a real mutation API remain explicitly monitoring-only instead of exposing decorative controls.
