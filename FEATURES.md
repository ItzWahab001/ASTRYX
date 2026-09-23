# DYNEX Feature Matrix

This file is intentionally limited to features backed by source code in `src/`.

| System | Implementation |
|---|---|
| Moderation | Persistent cases, warnings, hierarchy checks, DM notifications, evidence field |
| AutoMod | Native Discord AutoMod keyword/regex/spam/mention-spam/preset rules, exemptions, enable/disable/edit/delete, execution logs |
| Anti-raid | Sliding join/leave burst signals, account age, username similarity, configurable thresholds, quarantine, lockdown and automatic recovery |
| Anti-nuke | Audit-log executor detection, per-action thresholds, trusted users/roles, quarantine, containment, incident IDs and best-effort channel/role recovery |
| Tickets | Categories, staff role, claim, close, reopen, archive, add/remove, rename, lock/unlock, notes, priority, transcript, ratings, stats/history |
| Music | Per-guild player, persistent queue/history/config, play/search, skip/previous, pause/resume, stop, shuffle, loop, volume, seek, autoplay, reconnect/retry and control panel |
| Leveling | XP cooldown, levels, rank, leaderboard, admin XP set |
| Economy | Balance, daily, work, atomic pay transaction, transaction history |
| Giveaways | Persistent records, restart recovery, end, reroll, role requirement |
| Verification | Configurable role/channel, verify button, unverified-role removal |
| Welcome/Roles | Welcome/goodbye messaging, auto-role, dashboard channel selectors |
| Custom commands | Persistent prefix custom commands, variables, usage counter |
| AI | AI chat + AI teacher, timeout/retry/rate limit, per-guild enable flag |
| Dashboard | Discord OAuth2, refreshed guild authorization, CSRF, secure sessions, channel/role/category selectors, live overview, metrics and responsive control center |
| Operations | Structured logging, health endpoint, metrics, graceful shutdown |
