# DYNEX v2

DYNEX is a modular Discord.js v14 bot focused on production server infrastructure: moderation, Discord AutoMod management, raid/nuke protection, support tickets, music, economy, leveling, giveaways, verification, custom commands, AI and an OAuth2 dashboard.

## Runtime
- Node.js 20+
- discord.js v14
- SQLite + repository layer
- FFmpeg for voice playback
- Express + Discord OAuth2 dashboard

## Setup
1. Copy `.env.example` to `.env`.
2. Generate a long random `SESSION_SECRET` (48+ characters in production).
3. Set the Discord token/client ID/client secret and OAuth redirect URI.
4. `npm install`
5. `npm run migrate`
6. `npm start`

For `dynex.xyz`, set `PUBLIC_BASE_URL=https://dynex.xyz` and `DISCORD_REDIRECT_URI=https://dynex.xyz/auth/callback`.

## Discord intents
Enable the privileged intents required by your server configuration, especially **Server Members** and **Message Content** for welcome/level/custom-prefix behavior.

## Command groups
Moderation: `/ban`, `/kick`, `/timeout`, `/untimeout`, `/warn`, `/warnings`, `/clear`, `/slowmode`, `/lock`, `/unlock`, `/softban`, `/voice-mute`, `/voice-unmute`, `/case`, `/cases`, `/modhistory`, `/modlogs`.

AutoMod: `/automod setup`, `/automod status`, `/automod rules`, `/automod rule add`, `/automod rule edit`, `/automod rule delete`, `/automod exempt-role`, `/automod exempt-channel`, `/automod logs` plus legacy management commands.

Security: `/security`, `/antiraid`, `/antinuke`, `/antinuke-whitelist`, `/antinuke-threshold`, `/antinuke-lockdown`, `/security-logs`.

Tickets: `/ticket-setup`, `/ticket-panel`, `/ticket-add`, `/ticket-remove`, `/ticket-rename`, `/ticket-claim`, `/ticket-close`, `/ticket-reopen`, `/ticket-archive`, `/ticket-note`, `/ticket-priority`, `/ticket-lock`, `/ticket-unlock`, `/ticket-stats`, `/ticket-history`.

Music: `/play`, `/queue`, `/skip`, `/previous`, `/pause`, `/resume`, `/stop`, `/shuffle`, `/loop`, `/volume`, `/247`, `/music-panel`.

Community: `/welcome`, `/autorole`, `/verification-setup`, `/verification-panel`, `/rank`, `/leaderboard`, `/setxp`, `/reactionrole`, `/giveaway`, `/giveaway-end`, `/giveaway-reroll`.

Economy: `/balance`, `/daily`, `/work`, `/pay`, `/transactions`.

AI: `/ai`, `/ai-teacher`.

Configuration: `/settings`, `/configure`, `/custom-set`, `/custom-delete`, `/custom-list`, `/help`.

## Security model
Commands use a centralized middleware pipeline for guild checks, user permissions, bot permissions and cooldowns. Moderation uses Discord role hierarchy checks and server-owner protection. Dashboard writes require OAuth authorization plus CSRF validation.

Anti-raid uses sliding join/leave signals, account age, username similarity, risk scoring, quarantine, lockdown and automatic recovery. Anti-nuke uses Discord audit-log events, persistent thresholds, trusted users/roles, incident IDs and best-effort resource recovery.

## Database
SQLite is the supported runtime database in this release. Database access is isolated behind repositories and a transaction helper so PostgreSQL migration does not require rewriting command/business logic. PostgreSQL is intentionally not enabled in this release; `DATABASE_DRIVER=postgres` fails fast rather than pretending a PostgreSQL adapter exists. A future adapter must be tested against the same repository contract before activation.

## Dashboard
The dashboard is served by the bot process. It provides OAuth login with token refresh, live guild authorization, CSRF-protected settings, channel/role/category selectors, responsive control-center pages, security/AutoMod/ticket/music overview data, session storage and `/health` + `/metrics` endpoints.

## Testing
- `npm test` — Node test suite.
- `npm run check` — syntax + command loader check.
- `npm run lint` — ESLint.

CI currently uses `npm install` because this repository does not contain a generated lockfile; `npm ci` is intentionally not claimed until a real lockfile can be generated and committed.

## Production deployment
See `DEPLOYMENT.md` and `SECURITY.md`.
