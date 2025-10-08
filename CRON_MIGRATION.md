# Cron Migration from Vercel to Supabase

## Summary

Successfully migrated all cron jobs from Vercel to Supabase using pg_cron and Supabase Edge Functions.

## Changes Made

### 1. Supabase pg_cron Setup

**Migration**: `enable_pg_cron_and_schedule_alerts`
- Enabled `pg_cron` extension in Supabase
- Created scheduled job `check-alerts-every-15-minutes` that runs every 15 minutes
- Job executes: `*/15 * * * *` (every 15 minutes)
- Calls the edge function: `https://tbekcbbaxketpnztydvl.supabase.co/functions/v1/check-alerts-cron`

### 2. Edge Function Updates

**Function**: `check-alerts-cron`
- Updated authentication to accept both JWT tokens and CRON_SECRET
- Deployed with `--no-verify-jwt` flag for pg_cron compatibility
- Environment variables configured:
  - `CRON_SECRET`: tdSLSeKRQS6I1tV1zQTKsL57lm5vyFlYNMx0A4puSQU=
  - `SUPABASE_URL`: Automatically provided
  - `SUPABASE_SERVICE_ROLE_KEY`: Automatically provided
  - `MAILGUN_API_KEY`: Already configured
  - `MAILGUN_DOMAIN`: Already configured

### 3. Vercel Configuration

**File**: `vercel.json`
- Removed Vercel cron configuration
- File is now empty: `{}`

## How It Works

1. **Supabase pg_cron** triggers every 15 minutes
2. **pg_cron** makes an HTTP POST request to the edge function with the CRON_SECRET
3. **check-alerts-cron** edge function:
   - Fetches all active alerts from the database
   - Groups alerts by quantity to minimize API calls
   - Checks Glenstone availability API for each quantity
   - Matches available dates against alert preferences
   - Sends email notifications via `send-alert-email` edge function
   - Logs activity to `cron_logs` table
   - Respects 24-hour cooldown between notifications

## Testing

To manually trigger the cron job:

```bash
curl -X POST https://tbekcbbaxketpnztydvl.supabase.co/functions/v1/check-alerts-cron \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer tdSLSeKRQS6I1tV1zQTKsL57lm5vyFlYNMx0A4puSQU=" \
  -d '{}'
```

Expected response:
```json
{
  "message": "Alert check completed",
  "checked": 2,
  "notified": 0,
  "results": [],
  "duration": 3468
}
```

## Monitoring

### Check Cron Job Status

```sql
SELECT jobid, schedule, jobname, active, database
FROM cron.job
WHERE jobname = 'check-alerts-every-15-minutes';
```

### View Recent Cron Runs

```sql
SELECT * FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'check-alerts-every-15-minutes')
ORDER BY start_time DESC
LIMIT 10;
```

### View Application Logs

```sql
SELECT * FROM cron_logs
ORDER BY created_at DESC
LIMIT 10;
```

## Benefits of Supabase pg_cron

1. **No Vercel Pro required** - Free tier includes cron functionality
2. **Direct database access** - Faster queries without API overhead
3. **Built-in logging** - pg_cron tracks execution history
4. **More reliable** - Runs within database, not dependent on external service
5. **Same timezone** - All timestamps in database timezone
6. **No cold starts** - Edge function stays warm with regular executions

## Rollback Plan

If needed to rollback to Vercel cron:

1. Restore `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/check-alerts",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

2. Disable Supabase cron:
```sql
SELECT cron.unschedule('check-alerts-every-15-minutes');
```

3. The Next.js API route at `/api/cron/check-alerts` is still functional

## Next Steps

- Monitor cron execution for 24-48 hours
- Verify email notifications are sent correctly
- Check `cron_logs` table for any errors
- Can optionally remove `/app/api/cron/check-alerts/route.ts` if no longer needed for testing
