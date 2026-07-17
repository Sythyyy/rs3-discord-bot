CREATE TABLE users (
  id UUID PRIMARY KEY,
  discord_user_id TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE characters (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  coins BIGINT NOT NULL DEFAULT 100 CHECK (coins >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE character_skills (
  character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  skill_key TEXT NOT NULL,
  xp BIGINT NOT NULL DEFAULT 0 CHECK (xp >= 0),
  PRIMARY KEY (character_id, skill_key)
);

CREATE TABLE inventory_items (
  character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  item_key TEXT NOT NULL,
  quantity BIGINT NOT NULL CHECK (quantity > 0),
  PRIMARY KEY (character_id, item_key)
);

CREATE TABLE active_activities (
  id UUID PRIMARY KEY,
  character_id UUID NOT NULL UNIQUE REFERENCES characters(id) ON DELETE CASCADE,
  activity_key TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  completes_at TIMESTAMPTZ NOT NULL,
  claimed_at TIMESTAMPTZ,
  CHECK (completes_at > started_at)
);

CREATE TABLE economy_ledger (
  id UUID PRIMARY KEY,
  character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  entry_type TEXT NOT NULL,
  coin_delta BIGINT NOT NULL DEFAULT 0,
  item_key TEXT,
  item_quantity BIGINT,
  idempotency_key TEXT NOT NULL UNIQUE,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK ((item_key IS NULL) = (item_quantity IS NULL))
);

CREATE INDEX active_activities_completes_at_idx ON active_activities (completes_at);
CREATE INDEX economy_ledger_character_id_idx ON economy_ledger (character_id, created_at DESC);
