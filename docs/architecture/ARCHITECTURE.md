# Architecture

DYNEX is a monorepo with a hard boundary between Discord runtime and web runtime.

`apps/bot` → Discord gateway, commands, moderation/security/automod services.
`apps/dashboard` → Next.js OAuth UI and guild-scoped backend routes.
`packages/database` → Drizzle schema and DB factory.
`packages/ui` / `packages/design-system` → reusable React primitives and shared visual tokens.
`packages/types` → shared contracts.
`packages/config` → Zod environment validation.
`packages/logger` → structured JSON logging.

Privileged operations are server-side. Dashboard clients cannot directly execute Discord moderation operations.
