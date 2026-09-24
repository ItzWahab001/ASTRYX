# DYNEX API

The dashboard exposes server-side routes under `/api`.

- `GET /api/auth/login` starts Discord OAuth2.
- `GET /api/auth/callback` exchanges the authorization code and creates the HTTP-only OAuth cookie.
- `GET /api/guilds` returns only guilds where the OAuth user is owner or has Manage Server.
- `GET /api/guilds/:id/overview` revalidates guild access and reads real Discord metadata using the bot token.
- `GET/PATCH /api/guilds/:id/settings` revalidates guild access and reads/writes PostgreSQL settings.

All guild-scoped privileged routes re-check authorization server-side.
