-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create alerts table
CREATE TABLE IF NOT EXISTS alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  dates JSONB NOT NULL, -- Array of date strings in YYYY-MM-DD format
  time_of_day TEXT NOT NULL CHECK (time_of_day IN ('morning', 'midday', 'afternoon', 'any')),
  quantity INTEGER NOT NULL CHECK (quantity >= 1 AND quantity <= 10),
  min_capacity INTEGER,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_checked TIMESTAMPTZ
);

-- Create indexes for better query performance
CREATE INDEX idx_alerts_email ON alerts(email);
CREATE INDEX idx_alerts_active ON alerts(active);
CREATE INDEX idx_alerts_created_at ON alerts(created_at DESC);
CREATE INDEX idx_alerts_last_checked ON alerts(last_checked);

-- Enable Row Level Security
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Allow anyone to insert (create) alerts
CREATE POLICY "Anyone can create alerts" ON alerts
  FOR INSERT
  WITH CHECK (true);

-- Allow anyone to read their own alerts (by email)
CREATE POLICY "Users can view their own alerts" ON alerts
  FOR SELECT
  USING (true);

-- Allow users to update their own alerts
CREATE POLICY "Users can update their own alerts" ON alerts
  FOR UPDATE
  USING (true);

-- Allow users to delete their own alerts
CREATE POLICY "Users can delete their own alerts" ON alerts
  FOR DELETE
  USING (true);

-- Create a function to clean up old inactive alerts (optional)
CREATE OR REPLACE FUNCTION cleanup_old_alerts()
RETURNS void AS $$
BEGIN
  DELETE FROM alerts
  WHERE active = FALSE
    AND created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON TABLE alerts IS 'Stores user alerts for Glenstone ticket availability';
COMMENT ON COLUMN alerts.id IS 'Unique identifier for the alert';
COMMENT ON COLUMN alerts.email IS 'Email address to notify when tickets become available';
COMMENT ON COLUMN alerts.dates IS 'JSON array of dates (YYYY-MM-DD) the user is interested in';
COMMENT ON COLUMN alerts.time_of_day IS 'Preferred time of day: morning, midday, afternoon, or any';
COMMENT ON COLUMN alerts.quantity IS 'Number of tickets needed (1-10)';
COMMENT ON COLUMN alerts.min_capacity IS 'Minimum available slots required before sending alert';
COMMENT ON COLUMN alerts.active IS 'Whether the alert is active or has been fulfilled/cancelled';
COMMENT ON COLUMN alerts.created_at IS 'Timestamp when the alert was created';
COMMENT ON COLUMN alerts.last_checked IS 'Timestamp of the last time this alert was checked';
