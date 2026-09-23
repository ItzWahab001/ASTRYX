# DYNEX 2.3.3 — Dashboard Safety Patch

## Changes
- Dashboard boolean inputs are parsed explicitly; strings such as `false` and `0` no longer evaluate as enabled.
- Dashboard AutoMod bulk enable/disable now records the remote pre-change state and attempts rollback if a later rule update fails.
- Added regression coverage for boolean parsing.
- Existing 2.3.2 functionality and architecture preserved.

## Verification
- `node --check` passed for all `src/**/*.js`.
- Full `npm test` was not run in this environment because `node_modules` is not present.
- `package-lock.json` remains absent; it must be generated on a machine with npm registry access.
- Live Discord, OAuth, Docker and voice integration remain unverified.

## Remaining issues
1. Generate a genuine `package-lock.json` externally and run `npm ci`.
2. Run the complete test suite after dependencies are installed.
3. Perform live Discord verification for dashboard controls.
4. Security lockdown still stores channel IDs rather than a full pre-lockdown permission snapshot; do not assume unlock restores every pre-existing SendMessages state.
