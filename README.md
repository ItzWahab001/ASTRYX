# DYNEX-BOT - Combined Bundle

One organized project containing seven separate bot / website sources under `components/`.

## Components
| Folder | What it is | Start command (inside the folder) |
|---|---|---|
| ALL-IN-ONE-BOT | Multi-purpose bot (economy, moderation, tickets, leveling, music...) | `npm start` |
| AeroX-Security-Bot | Anti-nuke / anti-raid / automod security bot | see its README |
| Appy-Bot | Applications + tickets bot | `npm start` |
| Falcron | Invites / greet / giveaways bot | `npm start` |
| Feedback-Bot | Feedback collection bot | `npm start` |
| PrimeMusic-Lavalink | Lavalink music bot | `npm start` |
| Fluorine-landing-page | Next.js landing page / website | `npm run dev` |

Each component is an independent app with its own `package.json`, database and Discord token. They are kept separate on purpose: merging their JavaScript into one process would cause name and import collisions.

## Quick start
1. `npm run install:all` - installs dependencies for every component
2. Copy `.env.example` -> `.env` and fill in your own values (token, owner ID, MongoDB URI, Spotify keys, Lavalink node)
3. `cd components/<Bot>` and run its start command
4. `npm start` at the root only opens a small overview dashboard at http://localhost:3000

## Integrity check
- `npm run verify` - checks every file against `DYNEX-MANIFEST.json`
- `npm run manifest` - regenerates the manifest after you change files

## Notes
- No credentials are included. Everything secret is read from environment variables.
- The Nami macOS installers (.dmg) are NOT in this bundle (see `assets/nami/README.txt`).
- `ALL-IN-ONE-BOT` has an `excessCommands.hentai` switch in `config.json` (NSFW-channel only). Set it to `false` if you do not want those commands.
