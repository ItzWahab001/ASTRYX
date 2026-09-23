# DYNEX Deployment

## Railway
1. Push this repository to GitHub.
2. Create a Railway service from the repository.
3. Railway will use the included `Dockerfile`.
4. Add all required `.env` values in Railway Variables.
5. Use a persistent volume for `/app/data` if running SQLite.
6. Set `PUBLIC_BASE_URL=https://dynex.xyz` and `DISCORD_REDIRECT_URI=https://dynex.xyz/auth/callback`.
7. Point the custom domain to the Railway service.
8. Verify `/health` returns `ok: true`.

## Docker
```bash
cp .env.example .env
# edit .env
npm install
npm run migrate
docker compose up -d --build
```

## Required production values
`DISCORD_TOKEN`, `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`, `DISCORD_REDIRECT_URI`, `SESSION_SECRET`, `PUBLIC_BASE_URL`.

AI is optional. Music requires FFmpeg, which is installed by the provided Docker image.
