-- Create cron_logs table to track execution history
CREATE TABLE IF NOT EXISTS cron_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  status TEXT NOT NULL CHECK (status IN ('started', 'completed', 'failed')),
  alerts_checked INTEGER DEFAULT 0,
  notifications_sent INTEGER DEFAULT 0,
  error_message TEXT,
  metadata JSONB -- Store additional execution details
);

-- Create indexes for better query performance
CREATE INDEX idx_cron_logs_started_at ON cron_logs(started_at DESC);
CREATE INDEX idx_cron_logs_status ON cron_logs(status);
CREATE INDEX idx_cron_logs_completed_at ON cron_logs(completed_at DESC);

-- Enable Row Level Security
ALTER TABLE cron_logs ENABLE ROW LEVEL SECURITY;

-- Create policies (read-only for everyone, insert for service role)
CREATE POLICY "Anyone can view cron logs" ON cron_logs
  FOR SELECT
  USING (true);

CREATE POLICY "Service can insert cron logs" ON cron_logs
  FOR INSERT
  WITH CHECK (true);

-- Create a function to clean up old cron logs
CREATE OR REPLACE FUNCTION cleanup_old_cron_logs()
RETURNS void AS $$
BEGIN
  -- Keep only last 30 days of logs
  DELETE FROM cron_logs
  WHERE started_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Create a view for quick status overview
CREATE OR REPLACE VIEW cron_status_summary AS
SELECT
  COUNT(*) as total_executions,
  COUNT(*) FILTER (WHERE status = 'completed') as successful_executions,
  COUNT(*) FILTER (WHERE status = 'failed') as failed_executions,
  MAX(started_at) as last_execution,
  AVG(duration_ms) FILTER (WHERE status = 'completed') as avg_duration_ms,
  SUM(alerts_checked) as total_alerts_checked,
  SUM(notifications_sent) as total_notifications_sent
FROM cron_logs
WHERE started_at > NOW() - INTERVAL '7 days';

-- Add comments for documentation
COMMENT ON TABLE cron_logs IS 'Logs of cron job executions for monitoring and debugging';
COMMENT ON COLUMN cron_logs.id IS 'Unique identifier for the log entry';
COMMENT ON COLUMN cron_logs.started_at IS 'Timestamp when the cron job started';
COMMENT ON COLUMN cron_logs.completed_at IS 'Timestamp when the cron job completed';
COMMENT ON COLUMN cron_logs.duration_ms IS 'Duration of execution in milliseconds';
COMMENT ON COLUMN cron_logs.status IS 'Execution status: started, completed, or failed';
COMMENT ON COLUMN cron_logs.alerts_checked IS 'Number of alerts checked during this execution';
COMMENT ON COLUMN cron_logs.notifications_sent IS 'Number of notifications sent during this execution';
COMMENT ON COLUMN cron_logs.error_message IS 'Error message if the execution failed';
COMMENT ON COLUMN cron_logs.metadata IS 'Additional execution details and statistics';
