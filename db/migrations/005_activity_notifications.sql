ALTER TABLE active_activities
ADD COLUMN IF NOT EXISTS notification_channel_id TEXT;
