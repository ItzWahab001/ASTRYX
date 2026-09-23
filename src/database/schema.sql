CREATE TABLE IF NOT EXISTS guild_settings(guild_id TEXT PRIMARY KEY,prefix TEXT NOT NULL DEFAULT '!',welcome_channel_id TEXT,goodbye_channel_id TEXT,welcome_message TEXT NOT NULL DEFAULT 'Welcome {user} to {server}!',goodbye_message TEXT NOT NULL DEFAULT '{user} left {server}.',mod_log_channel_id TEXT,ticket_category_id TEXT,ticket_staff_role_id TEXT,ticket_transcript_channel_id TEXT,ticket_archive_category_id TEXT,verification_channel_id TEXT,verification_role_id TEXT,unverified_role_id TEXT,level_enabled INTEGER NOT NULL DEFAULT 1,economy_enabled INTEGER NOT NULL DEFAULT 1,ai_enabled INTEGER NOT NULL DEFAULT 1,antiraid_enabled INTEGER NOT NULL DEFAULT 1,antinuke_enabled INTEGER NOT NULL DEFAULT 1,automod_enabled INTEGER NOT NULL DEFAULT 0,antiraid_join_threshold INTEGER NOT NULL DEFAULT 20,antiraid_window_ms INTEGER NOT NULL DEFAULT 15000,antiraid_min_account_age_days INTEGER NOT NULL DEFAULT 7,antiraid_similarity_threshold REAL NOT NULL DEFAULT 0.85,dm_moderation INTEGER NOT NULL DEFAULT 1);
CREATE TABLE IF NOT EXISTS moderation_cases(id INTEGER PRIMARY KEY AUTOINCREMENT,guild_id TEXT NOT NULL,target_id TEXT NOT NULL,moderator_id TEXT NOT NULL,action TEXT NOT NULL,reason TEXT,evidence TEXT,duration_ms INTEGER,created_at INTEGER NOT NULL,active INTEGER NOT NULL DEFAULT 1);
CREATE INDEX IF NOT EXISTS idx_mod_cases_guild_target ON moderation_cases(guild_id,target_id);
CREATE TABLE IF NOT EXISTS warnings(id INTEGER PRIMARY KEY AUTOINCREMENT,guild_id TEXT NOT NULL,target_id TEXT NOT NULL,moderator_id TEXT NOT NULL,reason TEXT NOT NULL,created_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS tickets(id INTEGER PRIMARY KEY AUTOINCREMENT,guild_id TEXT NOT NULL,channel_id TEXT UNIQUE NOT NULL,user_id TEXT NOT NULL,category TEXT NOT NULL,reason TEXT,priority TEXT NOT NULL DEFAULT 'normal',claimed_by TEXT,status TEXT NOT NULL DEFAULT 'open',created_at INTEGER NOT NULL,closed_at INTEGER,closed_by TEXT);
CREATE INDEX IF NOT EXISTS idx_tickets_guild_status ON tickets(guild_id,status);
CREATE TABLE IF NOT EXISTS ticket_notes(id INTEGER PRIMARY KEY AUTOINCREMENT,ticket_id INTEGER NOT NULL,staff_id TEXT NOT NULL,note TEXT NOT NULL,created_at INTEGER NOT NULL,FOREIGN KEY(ticket_id) REFERENCES tickets(id) ON DELETE CASCADE);
CREATE TABLE IF NOT EXISTS levels(guild_id TEXT NOT NULL,user_id TEXT NOT NULL,xp INTEGER NOT NULL DEFAULT 0,level INTEGER NOT NULL DEFAULT 0,last_xp_at INTEGER NOT NULL DEFAULT 0,PRIMARY KEY(guild_id,user_id));
CREATE TABLE IF NOT EXISTS economy(guild_id TEXT NOT NULL,user_id TEXT NOT NULL,balance INTEGER NOT NULL DEFAULT 0,daily_at INTEGER NOT NULL DEFAULT 0,work_at INTEGER NOT NULL DEFAULT 0,PRIMARY KEY(guild_id,user_id));
CREATE TABLE IF NOT EXISTS economy_transactions(id INTEGER PRIMARY KEY AUTOINCREMENT,guild_id TEXT NOT NULL,from_user_id TEXT,to_user_id TEXT,amount INTEGER NOT NULL,type TEXT NOT NULL,created_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS giveaways(id INTEGER PRIMARY KEY AUTOINCREMENT,guild_id TEXT NOT NULL,channel_id TEXT NOT NULL,message_id TEXT UNIQUE NOT NULL,prize TEXT NOT NULL,winner_count INTEGER NOT NULL,ends_at INTEGER NOT NULL,ended INTEGER NOT NULL DEFAULT 0,required_role_id TEXT,min_account_age_days INTEGER);
CREATE TABLE IF NOT EXISTS giveaway_entries(giveaway_id INTEGER NOT NULL,user_id TEXT NOT NULL,PRIMARY KEY(giveaway_id,user_id),FOREIGN KEY(giveaway_id) REFERENCES giveaways(id) ON DELETE CASCADE);
CREATE TABLE IF NOT EXISTS custom_commands(guild_id TEXT NOT NULL,name TEXT NOT NULL,response TEXT NOT NULL,permissions TEXT,enabled INTEGER NOT NULL DEFAULT 1,cooldown_ms INTEGER NOT NULL DEFAULT 0,uses INTEGER NOT NULL DEFAULT 0,PRIMARY KEY(guild_id,name));
CREATE TABLE IF NOT EXISTS reaction_roles(guild_id TEXT NOT NULL,message_id TEXT NOT NULL,role_id TEXT NOT NULL,label TEXT NOT NULL,PRIMARY KEY(message_id,role_id));
CREATE TABLE IF NOT EXISTS security_events(id INTEGER PRIMARY KEY AUTOINCREMENT,guild_id TEXT NOT NULL,actor_id TEXT,event_type TEXT NOT NULL,details TEXT,created_at INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS idx_security_guild_time ON security_events(guild_id,created_at);
CREATE TABLE IF NOT EXISTS automod_rules(guild_id TEXT NOT NULL,rule_id TEXT NOT NULL,name TEXT NOT NULL,type TEXT NOT NULL,enabled INTEGER NOT NULL DEFAULT 1,config_json TEXT NOT NULL,created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL,PRIMARY KEY(guild_id,rule_id));
CREATE TABLE IF NOT EXISTS dashboard_audit(id INTEGER PRIMARY KEY AUTOINCREMENT,user_id TEXT,guild_id TEXT,action TEXT,ip TEXT,created_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS security_whitelist(guild_id TEXT NOT NULL,user_id TEXT,role_id TEXT,kind TEXT NOT NULL,PRIMARY KEY(guild_id,user_id,role_id,kind));
CREATE TABLE IF NOT EXISTS security_thresholds(guild_id TEXT NOT NULL,event_type TEXT NOT NULL,threshold INTEGER NOT NULL DEFAULT 3,window_ms INTEGER NOT NULL DEFAULT 15000,PRIMARY KEY(guild_id,event_type));

CREATE TABLE IF NOT EXISTS autoroles(guild_id TEXT NOT NULL,role_id TEXT NOT NULL,PRIMARY KEY(guild_id,role_id));
CREATE TABLE IF NOT EXISTS security_state(guild_id TEXT PRIMARY KEY,raid_mode INTEGER NOT NULL DEFAULT 0,raid_until INTEGER NOT NULL DEFAULT 0,incident_id TEXT,updated_at INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS ticket_ratings(ticket_id INTEGER PRIMARY KEY,user_id TEXT NOT NULL,rating INTEGER NOT NULL,created_at INTEGER NOT NULL,FOREIGN KEY(ticket_id) REFERENCES tickets(id) ON DELETE CASCADE);

CREATE TABLE IF NOT EXISTS automod_logs(id INTEGER PRIMARY KEY AUTOINCREMENT,guild_id TEXT NOT NULL,rule_id TEXT,user_id TEXT,channel_id TEXT,action_type TEXT,content_hash TEXT,details TEXT,created_at INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS idx_automod_logs_guild_time ON automod_logs(guild_id,created_at);
CREATE TABLE IF NOT EXISTS music_config(guild_id TEXT PRIMARY KEY,volume INTEGER NOT NULL DEFAULT 80,loop_mode TEXT NOT NULL DEFAULT 'off',twenty_four INTEGER NOT NULL DEFAULT 0,autoplay INTEGER NOT NULL DEFAULT 0,updated_at INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS security_incidents(id INTEGER PRIMARY KEY AUTOINCREMENT,incident_id TEXT UNIQUE NOT NULL,guild_id TEXT NOT NULL,actor_id TEXT,event_type TEXT NOT NULL,evidence_json TEXT NOT NULL,action TEXT NOT NULL,created_at INTEGER NOT NULL,recovered_at INTEGER);
CREATE INDEX IF NOT EXISTS idx_security_incidents_guild_time ON security_incidents(guild_id,created_at);

CREATE TABLE IF NOT EXISTS security_lockdown_channels(guild_id TEXT NOT NULL,channel_id TEXT NOT NULL,created_at INTEGER NOT NULL,had_explicit_allow INTEGER NOT NULL DEFAULT 0,PRIMARY KEY(guild_id,channel_id));

CREATE TABLE IF NOT EXISTS security_recovery_snapshots(id INTEGER PRIMARY KEY AUTOINCREMENT,guild_id TEXT NOT NULL,target_id TEXT NOT NULL,target_type TEXT NOT NULL,snapshot_json TEXT NOT NULL,created_at INTEGER NOT NULL,restored_at INTEGER);
CREATE INDEX IF NOT EXISTS idx_recovery_target ON security_recovery_snapshots(guild_id,target_id,created_at);
CREATE TABLE IF NOT EXISTS music_queue(guild_id TEXT NOT NULL,position INTEGER NOT NULL,track_json TEXT NOT NULL,PRIMARY KEY(guild_id,position));
CREATE TABLE IF NOT EXISTS music_history(guild_id TEXT NOT NULL,position INTEGER NOT NULL,track_json TEXT NOT NULL,created_at INTEGER NOT NULL,PRIMARY KEY(guild_id,position));
