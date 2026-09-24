# DYNEX Configuration

Required: `DISCORD_TOKEN`, `DISCORD_CLIENT_ID`, `DATABASE_URL`.

Dashboard: `DASHBOARD_URL`, `OAUTH_REDIRECT_URI`, `SESSION_SECRET`.

AI: `AI_API_KEY`, optional `AI_BASE_URL`, `AI_MODEL`, `AI_RATE_LIMIT_SECONDS`.

Translation: `TRANSLATION_PROVIDER=libretranslate`, `TRANSLATION_BASE_URL`, optional `TRANSLATION_API_KEY`.

Music: `FFMPEG_PATH`.

The bot persists guild configuration in PostgreSQL. Dashboard changes write to the same database used by the bot. Privileged Discord actions still execute through the bot and validate server-side permissions.
