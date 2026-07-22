ALTER TABLE active_activities
  ADD COLUMN IF NOT EXISTS requested_quantity BIGINT CHECK (requested_quantity > 0),
  ADD COLUMN IF NOT EXISTS target_reached BOOLEAN;

ALTER TABLE woodcutting_trip_results
  ADD COLUMN IF NOT EXISTS requested_quantity BIGINT CHECK (requested_quantity > 0),
  ADD COLUMN IF NOT EXISTS target_reached BOOLEAN;
