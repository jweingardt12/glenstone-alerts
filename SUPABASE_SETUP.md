# 🚀 Supabase Setup Guide

Complete guide for setting up Supabase database and edge functions for the Glenstone Alerts application.

## Prerequisites

- [Supabase CLI](https://supabase.com/docs/guides/cli) installed
- A [Supabase account](https://app.supabase.com)
- [Resend account](https://resend.com) for email sending (optional)

## Step 1: Create a Supabase Project

1. Go to [app.supabase.com](https://app.supabase.com)
2. Click "New Project"
3. Choose your organization
4. Set a project name (e.g., "glenstone-alerts")
5. Set a strong database password
6. Choose a region close to your users
7. Click "Create new project"

## Step 2: Get Your API Keys

1. Go to **Project Settings** → **API**
2. Copy the following values:
   - **Project URL**: `https://your-project-id.supabase.co`
   - **anon/public key**: Used for client-side access
   - **service_role key**: Used for server-side admin access (keep secret!)

## Step 3: Configure Environment Variables

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Edit `.env.local` and add your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   ```

## Step 4: Run Database Migrations

### Option A: Using Supabase CLI (Recommended)

1. Link your local project to Supabase:
   ```bash
   npx supabase link --project-ref your-project-id
   ```

2. Run the migration:
   ```bash
   npx supabase db push
   ```

### Option B: Using Supabase Dashboard

1. Go to **Database** → **SQL Editor** in your Supabase dashboard
2. Open the file `supabase/migrations/001_initial_schema.sql`
3. Copy the entire SQL script
4. Paste it into the SQL Editor
5. Click "Run" to execute the migration

### Verify Migration

Go to **Table Editor** in your Supabase dashboard. You should see the `alerts` table with the following columns:
- `id` (uuid)
- `email` (text)
- `dates` (jsonb)
- `time_of_day` (text)
- `quantity` (integer)
- `min_capacity` (integer, nullable)
- `active` (boolean)
- `created_at` (timestamptz)
- `last_checked` (timestamptz, nullable)

## Step 5: Set Up Email Service (Optional)

For production email sending, set up Resend:

1. Sign up at [resend.com](https://resend.com)
2. Verify your domain or use their testing domain
3. Get your API key from the dashboard
4. Add it to your `.env.local`:
   ```env
   RESEND_API_KEY=re_your_api_key_here
   ```

## Step 6: Deploy Edge Functions (Optional)

Edge functions handle email sending via Supabase's serverless infrastructure.

### Deploy the Functions

1. Make sure you're logged in to Supabase CLI:
   ```bash
   npx supabase login
   ```

2. Deploy the send-alert-email function:
   ```bash
   npx supabase functions deploy send-alert-email
   ```

3. Deploy the send-confirmation-email function:
   ```bash
   npx supabase functions deploy send-confirmation-email
   ```

### Configure Edge Function Secrets

Set the Resend API key as a secret for your edge functions:

```bash
npx supabase secrets set RESEND_API_KEY=re_your_api_key_here
```

### Update Email "From" Address

Edit both edge function files and change the `from` address:
- `supabase/functions/send-alert-email/index.ts`
- `supabase/functions/send-confirmation-email/index.ts`

Change this line:
```typescript
from: "Glenstone Alerts <alerts@yourdomain.com>",
```

To your verified Resend domain:
```typescript
from: "Glenstone Alerts <alerts@your-verified-domain.com>",
```

### Enable Edge Functions

Update your `.env.local`:
```env
USE_SUPABASE_EDGE_FUNCTIONS=true
```

## Step 7: Test Your Setup

### Test Database Connection

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Create a test alert via the UI or API:
   ```bash
   curl -X POST http://localhost:3000/api/alerts \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@example.com",
       "dates": ["2025-10-16"],
       "timeOfDay": "any",
       "quantity": 2
     }'
   ```

3. Verify the alert was created in your Supabase dashboard:
   - Go to **Table Editor** → **alerts**
   - You should see your test alert

### Test Edge Functions (if deployed)

1. Make sure `USE_SUPABASE_EDGE_FUNCTIONS=true` in `.env.local`

2. Trigger the cron job:
   ```bash
   curl http://localhost:3000/api/cron/check-alerts
   ```

3. Check your email inbox for the test notification

### Test Email Locally (without Edge Functions)

If you haven't deployed edge functions:

1. Make sure `USE_SUPABASE_EDGE_FUNCTIONS=false` in `.env.local`
2. Emails will be logged to your console instead of sent

## Step 8: Production Deployment

### Deploy to Vercel

1. Push your code to GitHub

2. Import your project in [Vercel](https://vercel.com)

3. Add environment variables in Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `USE_SUPABASE_EDGE_FUNCTIONS`
   - `CRON_SECRET` (optional)

4. Deploy!

### Set Up Vercel Cron

The `vercel.json` file is already configured to run the cron job every 15 minutes. Vercel will automatically detect and enable it on deployment.

## Troubleshooting

### "Missing Supabase environment variables"

Make sure you have set:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

in your `.env.local` file.

### Database Connection Errors

1. Check your Supabase project is active
2. Verify your API keys are correct
3. Check Row Level Security (RLS) policies are enabled

### Edge Functions Not Working

1. Verify functions are deployed:
   ```bash
   npx supabase functions list
   ```

2. Check function logs:
   ```bash
   npx supabase functions logs send-alert-email
   ```

3. Verify secrets are set:
   ```bash
   npx supabase secrets list
   ```

### Emails Not Sending

1. Check your Resend API key is valid
2. Verify your sending domain is verified in Resend
3. Check edge function logs for errors
4. Make sure `USE_SUPABASE_EDGE_FUNCTIONS=true`

### RLS Policy Issues

If you get permission errors, check the RLS policies in the SQL migration file are applied correctly. You can disable RLS temporarily for testing:

```sql
ALTER TABLE alerts DISABLE ROW LEVEL SECURITY;
```

(Don't forget to re-enable it for production!)

## Database Maintenance

### Clean Up Old Alerts

Run the cleanup function to remove old inactive alerts:

```sql
SELECT cleanup_old_alerts();
```

You can set this up as a scheduled job in Supabase:
1. Go to **Database** → **Extensions**
2. Enable `pg_cron`
3. Create a scheduled job to run weekly

### Backup Your Database

Supabase automatically creates backups, but you can also:

1. Go to **Database** → **Backups**
2. Configure backup schedule
3. Download backups manually if needed

## Advanced Configuration

### Custom Email Templates

Edit the email templates in the edge functions:
- `supabase/functions/send-alert-email/index.ts`
- `supabase/functions/send-confirmation-email/index.ts`

Look for the `generateAvailabilityEmail()` and `generateConfirmationEmail()` functions.

### Add More Fields to Alerts

1. Create a new migration file:
   ```bash
   npx supabase migration new add_alerts_fields
   ```

2. Add your ALTER TABLE commands

3. Push the migration:
   ```bash
   npx supabase db push
   ```

4. Update TypeScript types in `lib/supabase.ts` and `lib/types.ts`

## Security Best Practices

1. **Never commit secrets**: Keep `.env.local` in `.gitignore`
2. **Use service role key carefully**: Only use it server-side
3. **Enable RLS**: Always use Row Level Security in production
4. **Rate limiting**: Add rate limiting to your API routes
5. **Validate input**: Always validate user input before database queries
6. **Monitor usage**: Set up Supabase usage alerts

## Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase CLI Reference](https://supabase.com/docs/reference/cli)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Resend Documentation](https://resend.com/docs)
- [Next.js Environment Variables](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)

## Getting Help

- [Supabase Discord](https://discord.supabase.com)
- [Supabase GitHub Discussions](https://github.com/supabase/supabase/discussions)
- [Glenstone Alerts Issues](https://github.com/yourusername/glenstone-alerts/issues)
