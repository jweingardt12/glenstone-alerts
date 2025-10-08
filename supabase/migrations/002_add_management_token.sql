-- Add management token column for secure alert management
ALTER TABLE alerts
ADD COLUMN management_token TEXT;

-- Create unique index on management_token
CREATE UNIQUE INDEX idx_alerts_management_token ON alerts(management_token) WHERE management_token IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN alerts.management_token IS 'Secure token for managing alerts via email link';
