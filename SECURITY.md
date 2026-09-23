# DYNEX Security Notes

- Never commit `.env` or Discord tokens.
- Production requires a strong `SESSION_SECRET`.
- Dashboard state changes require OAuth authorization and CSRF validation.
- Moderation blocks self-targeting, server-owner targeting and role-hierarchy violations.
- Anti-nuke does not treat the server owner as an attacker and supports persistent user/role whitelists.
- The bot should not be granted Administrator unless the operator accepts the additional blast radius.
- AutoMod and anti-nuke actions depend on Discord permissions and audit-log availability.
- Dashboard and bot should run behind HTTPS in production.
