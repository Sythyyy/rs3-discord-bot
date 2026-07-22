ALTER TABLE active_activities
  ADD COLUMN IF NOT EXISTS planned_attempts BIGINT,
  ADD COLUMN IF NOT EXISTS executed_attempts BIGINT,
  ADD COLUMN IF NOT EXISTS rng_audit JSONB;

ALTER TABLE woodcutting_trip_results
  DROP CONSTRAINT IF EXISTS woodcutting_trip_results_actual_logs_check;

ALTER TABLE woodcutting_trip_results
  ADD COLUMN IF NOT EXISTS planned_attempts BIGINT,
  ADD COLUMN IF NOT EXISTS executed_attempts BIGINT,
  ADD COLUMN IF NOT EXISTS rng_audit JSONB;

ALTER TABLE woodcutting_trip_results
  ADD CONSTRAINT woodcutting_trip_results_actual_logs_check
  CHECK (actual_logs >= 0 AND actual_logs <= planned_attempts);
