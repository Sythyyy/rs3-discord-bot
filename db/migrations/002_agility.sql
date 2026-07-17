CREATE TABLE agility_catalogue_versions (
  id UUID PRIMARY KEY,
  version TEXT NOT NULL UNIQUE,
  source_url TEXT NOT NULL,
  verified_at TIMESTAMPTZ NOT NULL,
  content_hash TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('approved', 'draft', 'superseded')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE agility_courses (
  id UUID PRIMARY KEY,
  catalogue_version_id UUID NOT NULL REFERENCES agility_catalogue_versions(id),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  required_agility_level INTEGER NOT NULL CHECK (required_agility_level BETWEEN 1 AND 120),
  required_quests JSONB NOT NULL DEFAULT '[]',
  access_requirements TEXT NOT NULL DEFAULT '',
  obstacle_count INTEGER,
  base_xp_per_obstacle NUMERIC(12,2),
  base_lap_completion_xp NUMERIC(12,2),
  estimated_base_xp_per_hour_min INTEGER,
  estimated_base_xp_per_hour_max INTEGER,
  estimated_rate_notes TEXT NOT NULL DEFAULT '',
  failure_possible BOOLEAN NOT NULL DEFAULT FALSE,
  failure_notes TEXT NOT NULL DEFAULT '',
  reward_summary TEXT NOT NULL DEFAULT '',
  source_url TEXT NOT NULL,
  source_revision_or_verified_at TEXT NOT NULL,
  needs_verification BOOLEAN NOT NULL DEFAULT TRUE,
  active BOOLEAN NOT NULL DEFAULT FALSE,
  bot_duration_seconds INTEGER NOT NULL CHECK (bot_duration_seconds > 0),
  bot_laps_per_activity INTEGER NOT NULL CHECK (bot_laps_per_activity > 0),
  bot_xp_per_activity BIGINT NOT NULL CHECK (bot_xp_per_activity >= 0),
  bot_balance_notes TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE agility_course_rewards (
  id UUID PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES agility_courses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  quantity_min INTEGER,
  quantity_max INTEGER,
  chance NUMERIC(8,6),
  requirements_conditions TEXT NOT NULL DEFAULT '',
  source_url TEXT NOT NULL,
  verified_at TIMESTAMPTZ NOT NULL,
  needs_verification BOOLEAN NOT NULL DEFAULT TRUE
);

ALTER TABLE active_activities ADD COLUMN activity_type TEXT NOT NULL DEFAULT 'standard';
CREATE TABLE agility_activity_details (
  active_activity_id UUID PRIMARY KEY REFERENCES active_activities(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES agility_courses(id),
  catalogue_version_id UUID NOT NULL REFERENCES agility_catalogue_versions(id),
  planned_laps INTEGER NOT NULL,
  planned_obstacles INTEGER,
  bot_xp_award BIGINT NOT NULL,
  source_xp_snapshot JSONB NOT NULL,
  reward_snapshot JSONB NOT NULL DEFAULT '[]'
);

CREATE TABLE agility_reward_history (
  id UUID PRIMARY KEY,
  character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  activity_id UUID NOT NULL UNIQUE,
  course_id UUID NOT NULL REFERENCES agility_courses(id),
  xp_awarded BIGINT NOT NULL,
  rewards JSONB NOT NULL,
  idempotency_key TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE agility_data_refresh_proposals (
  id UUID PRIMARY KEY,
  requested_by_discord_user_id TEXT NOT NULL,
  source_url TEXT NOT NULL,
  source_revision TEXT,
  fetched_at TIMESTAMPTZ NOT NULL,
  payload_hash TEXT NOT NULL,
  preview JSONB NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending_confirmation', 'approved', 'rejected', 'expired')),
  confirmed_at TIMESTAMPTZ,
  confirmed_by_discord_user_id TEXT
);

INSERT INTO character_skills (character_id, skill_key, xp)
SELECT id, 'agility', 0 FROM characters ON CONFLICT (character_id, skill_key) DO NOTHING;

CREATE INDEX agility_courses_active_idx ON agility_courses (active, needs_verification, required_agility_level);
