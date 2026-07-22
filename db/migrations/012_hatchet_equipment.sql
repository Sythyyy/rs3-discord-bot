CREATE TABLE IF NOT EXISTS character_equipment (
  character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  slot TEXT NOT NULL CHECK (slot IN ('hatchet')),
  item_key TEXT NOT NULL,
  equipped_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (character_id, slot)
);

ALTER TABLE active_activities
  ADD COLUMN IF NOT EXISTS boost_snapshot JSONB;

ALTER TABLE woodcutting_trip_results
  ADD COLUMN IF NOT EXISTS boost_snapshot JSONB;
