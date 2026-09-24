# DYNEX Research → Implementation Matrix

Research used official Discord/discord.js documentation plus the product patterns specified in Parts 1–4. Discord AutoMod supports native keyword, preset, spam, mention-spam and member-profile triggers with actions and channel/role exemptions; DYNEX syncs its configured rules through the Discord API rather than pretending to implement a private filter. See Discord's current AutoMod documentation and discord.js 14.26 API surface. 

| Area | Observation | DYNEX implementation | Verification | Status |
|---|---|---|---|---|
| Moderation | Permission + hierarchy checks are mandatory | centralized `assertMemberAction`, cases, warnings, audit | source + typecheck when deps installed | PARTIAL |
| Security | Raid/nuke detection needs event windows and trusted identities | join burst + audit-log mass-action windows, trusted table, lockdown | unit coverage planned | PARTIAL |
| AutoMod | Discord provides native rule APIs | native rule sync + execution logging | API integration | PARTIAL |
| Tickets | Persistent state must survive restart | PostgreSQL ticket/panel/transcript tables + interaction IDs | DB-backed handlers | IMPLEMENTED |
| Music | Per-guild state + voice player lifecycle | per-guild player map, queue, loop, shuffle, controls, FFmpeg | direct media URL | PARTIAL |
| Leveling | XP needs cooldown and persistent rewards | PostgreSQL XP/rewards + cooldown | DB path | IMPLEMENTED |
| Economy | Transactions should be persisted | balance + transaction ledger + shop/inventory | DB path | IMPLEMENTED |
| Giveaways | Entries and state must survive restart | PostgreSQL entries + scheduled finalization | DB path | IMPLEMENTED |
| Roles | Persistent component IDs are required | DB role panels + restart-safe select handling | DB lookup | IMPLEMENTED |
| Analytics | Metrics must be sourced from real events | analytics event table | dashboard API | IMPLEMENTED |
| Backups | Discord-supported configuration only | roles/channels/guild settings snapshot | command | IMPLEMENTED |
| AI | Provider and keys must be configurable | OpenAI-compatible endpoint + guild/channel config + cooldown | environment dependent | PARTIAL |
| Translation | Provider must be external and explicit | LibreTranslate-compatible integration | environment dependent | PARTIAL |
| Dashboard | Backend must validate guild permissions | OAuth + server-side guild permission checks + shared config DB | API routes | PARTIAL |
