-- Update cron schedule from 15 minutes to 30 minutes
-- This migration updates the existing check-alerts cron job

-- Unschedule the old 15-minute job if it exists
SELECT cron.unschedule('check-alerts-every-15-minutes');

-- Create new 30-minute schedule
SELECT cron.schedule(
  'check-alerts-every-30-minutes',
  '*/30 * * * *',
  $$
  SELECT
    net.http_post(
      url := 'https://tbekcbbaxketpnztydvl.supabase.co/functions/v1/check-alerts-cron',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.cron_secret')
      ),
      body := '{}'::jsonb
    );
  $$
);
