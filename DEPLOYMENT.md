# DYNEX Deployment

## Railway
1. Create a Railway project.
2. Add PostgreSQL.
3. Deploy the repository with the root Dockerfile.
4. Set the variables from `.env.example`.
5. Set `OAUTH_REDIRECT_URI` to the deployed dashboard callback URL and add the same URL in the Discord Developer Portal.
6. Run the migration SQL from `packages/database/drizzle/0000_init.sql` and `0001_systems.sql` against PostgreSQL before first production start.

## Discord permissions/intents
DYNEX needs the privileged intents actually used by the configured systems, especially Guild Members and Message Content. Discord has updated data-access requirements, so enable only the intents the deployment genuinely needs and follow Discord's current developer review requirements. citeturn0search13

## AutoMod
Native AutoMod rule creation requires the bot to have the permissions Discord requires for managing moderation rules. DYNEX uses Discord's supported AutoMod API rather than a private implementation. citeturn0search0turn0search12

## Music
Set `FFMPEG_PATH`. The current player accepts direct HTTP(S) media URLs. YouTube/Spotify resolution is intentionally not claimed without a compliant resolver/provider.
