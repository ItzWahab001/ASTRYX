-- Meridian core schema: guild config, moderation cases, automod rules, anti-nuke whitelist/actions.
-- Applied via `npm run migrate` (see src/db/migrate.ts).

CREATE TABLE IF NOT EXISTS guild_config (
  guild_id            TEXT PRIMARY KEY,
  admin_role_ids       TEXT[] NOT NULL DEFAULT '{}',
  mod_log_channel_id   TEXT,
  join_log_channel_id  TEXT,
  quarantine_role_id   TEXT,
  escalation_chain     JSONB NOT NULL DEFAULT '["warn","mute","kick","ban"]',
  escalation_threshold INTEGER NOT NULL DEFAULT 3,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS moderation_cases (
  id            BIGSERIAL PRIMARY KEY,
  guild_id      TEXT NOT NULL REFERENCES guild_config(guild_id) ON DELETE CASCADE,
  case_number   INTEGER NOT NULL,
  target_id     TEXT NOT NULL,
  moderator_id  TEXT NOT NULL,
  action_type   TEXT NOT NULL CHECK (action_type IN ('warn','mute','kick','ban','unban','unmute')),
  reason        TEXT,
  source        TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual','automod','antinuke','antiraid')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (guild_id, case_number)
);
CREATE INDEX IF NOT EXISTS idx_cases_guild_target ON moderation_cases (guild_id, target_id);

CREATE TABLE IF NOT EXISTS automod_rules (
  id            BIGSERIAL PRIMARY KEY,
  guild_id      TEXT NOT NULL REFERENCES guild_config(guild_id) ON DELETE CASCADE,
  rule_type     TEXT NOT NULL CHECK (rule_type IN ('word_filter','link_filter','mention_spam','message_spam')),
  enabled       BOOLEAN NOT NULL DEFAULT true,
  config        JSONB NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (guild_id, rule_type)
);

CREATE TABLE IF NOT EXISTS antinuke_whitelist (
  guild_id   TEXT NOT NULL REFERENCES guild_config(guild_id) ON DELETE CASCADE,
  user_id    TEXT NOT NULL,
  added_by   TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (guild_id, user_id)
);

CREATE TABLE IF NOT EXISTS antinuke_incidents (
  id           BIGSERIAL PRIMARY KEY,
  guild_id     TEXT NOT NULL REFERENCES guild_config(guild_id) ON DELETE CASCADE,
  actor_id     TEXT NOT NULL,
  action_count INTEGER NOT NULL,
  window_seconds INTEGER NOT NULL,
  response     TEXT NOT NULL CHECK (response IN ('quarantined','kicked','logged_only')),
  detail       JSONB NOT NULL DEFAULT '{}',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_infractions (
  guild_id  TEXT NOT NULL REFERENCES guild_config(guild_id) ON DELETE CASCADE,
  user_id   TEXT NOT NULL,
  count     INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (guild_id, user_id)
);
