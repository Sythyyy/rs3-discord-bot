ALTER TABLE active_activities
  ADD COLUMN IF NOT EXISTS actual_quantity BIGINT,
  ADD COLUMN IF NOT EXISTS min_duration_ms INTEGER,
  ADD COLUMN IF NOT EXISTS max_duration_ms INTEGER,
  ADD COLUMN IF NOT EXISTS xp_award BIGINT,
  ADD COLUMN IF NOT EXISTS fatigue_ended BOOLEAN,
  ADD COLUMN IF NOT EXISTS formula_version TEXT;

CREATE TABLE IF NOT EXISTS woodcutting_trip_results (
  activity_id UUID PRIMARY KEY,
  character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  activity_key TEXT NOT NULL,
  target_logs BIGINT NOT NULL CHECK (target_logs > 0),
  actual_logs BIGINT NOT NULL CHECK (actual_logs > 0 AND actual_logs <= target_logs),
  min_duration_ms INTEGER NOT NULL CHECK (min_duration_ms > 0),
  max_duration_ms INTEGER NOT NULL CHECK (max_duration_ms >= min_duration_ms),
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL,
  xp_award BIGINT NOT NULL CHECK (xp_award >= 0),
  fatigue_ended BOOLEAN NOT NULL,
  formula_version TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS woodcutting_trip_results_character_idx
  ON woodcutting_trip_results (character_id, completed_at DESC);

CREATE TABLE IF NOT EXISTS woodcutting_repeat_uses (
  source_activity_id UUID PRIMARY KEY REFERENCES woodcutting_trip_results(activity_id) ON DELETE CASCADE,
  repeated_activity_id UUID NOT NULL UNIQUE,
  used_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
