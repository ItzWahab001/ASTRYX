# DYNEX

Production-oriented Discord bot + separate Next.js dashboard monorepo.

## Stack
Node.js LTS, TypeScript, discord.js, Next.js, PostgreSQL/Drizzle, FFmpeg for direct media playback, Docker and Railway.

## Major real systems
Moderation/cases, security event detection, native Discord AutoMod sync, persistent tickets/transcripts, per-guild music player state, leveling, economy ledger/shop/inventory, giveaways, role panels/autoroles, welcome, starboard, polls, suggestions, analytics, events/RSVP, supported Discord configuration backups, translation provider integration, AI provider integration, interactive help/setup, and dashboard-backed configuration.

## Honest limitations
Music currently accepts direct HTTP(S) media URLs rather than claiming unsupported YouTube/Spotify extraction. Translation requires a configured provider. AI requires an API key. Temp Voice and safe backup restore/diff are not claimed complete. See `FEATURE-AUDIT.md`.

## Install
`corepack enable && pnpm install`

## Verify
`pnpm lint && pnpm typecheck && pnpm test && pnpm build`

## Deploy
See `DEPLOYMENT.md` and `.env.example`.
