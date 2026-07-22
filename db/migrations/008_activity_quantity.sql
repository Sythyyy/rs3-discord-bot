ALTER TABLE active_activities
ADD COLUMN quantity BIGINT NOT NULL DEFAULT 3 CHECK (quantity > 0);
