-- Add last_notified_at column to track when notifications were last sent
-- This allows sending daily reminders (24 hour intervals) instead of one-time alerts

ALTER TABLE alerts
ADD COLUMN last_notified_at TIMESTAMPTZ;

-- Add index for efficient querying of alerts that haven't been notified recently
CREATE INDEX idx_alerts_last_notified ON alerts(last_notified_at) WHERE active = true;

-- Add comment explaining the column
COMMENT ON COLUMN alerts.last_notified_at IS 'Timestamp of last notification sent. Alerts can be re-notified after 24 hours.';
