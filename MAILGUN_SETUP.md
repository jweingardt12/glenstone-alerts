# 📧 Mailgun Email Setup

Since you already have a Mailgun account, here's how to get emails working:

## Step 1: Get Your Mailgun Credentials

1. Go to: **https://app.mailgun.com/app/dashboard**
2. Navigate to **Sending** → **Domains**
3. Click on your domain (or use the sandbox domain for testing)
4. Note down:
   - **Domain name** (e.g., `sandbox123.mailgun.org` or `yourdomain.com`)
   - **API Key** (Settings → API Keys → Private API key)

## Step 2: Get Supabase Service Role Key

1. Go to: **https://app.supabase.com/project/tbekcbbaxketpnztydvl/settings/api**
2. Copy the **service_role** key (the secret one at the bottom)

## Step 3: Update .env.local

Add these to your `.env.local`:

```env
# Supabase Service Role Key (required)
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...your-service-role-key

# Mailgun Configuration
MAILGUN_API_KEY=your-mailgun-private-api-key
MAILGUN_DOMAIN=sandbox123.mailgun.org
# Or use your verified domain:
# MAILGUN_DOMAIN=yourdomain.com
```

## Step 4: Set Secrets in Supabase Edge Functions

The edge functions need access to your Mailgun credentials. Run these commands:

```bash
# Set Mailgun API Key
npx supabase secrets set MAILGUN_API_KEY=your-mailgun-api-key --project-ref tbekcbbaxketpnztydvl

# Set Mailgun Domain
npx supabase secrets set MAILGUN_DOMAIN=sandbox123.mailgun.org --project-ref tbekcbbaxketpnztydvl
```

**Or** via the dashboard:
1. Go to: https://app.supabase.com/project/tbekcbbaxketpnztydvl/settings/functions
2. Click "Manage secrets"
3. Add two secrets:
   - `MAILGUN_API_KEY` = `your-mailgun-api-key`
   - `MAILGUN_DOMAIN` = `sandbox123.mailgun.org`

## Step 5: Restart Your Dev Server

```bash
npm run dev
```

## Step 6: Test It!

1. Go to http://localhost:3000
2. Click "Create Alert"
3. Enter your email
4. Select a date
5. Submit

**Check:**
- ✅ Your email inbox (including spam folder)
- ✅ Mailgun logs: https://app.mailgun.com/app/logs
- ✅ Supabase function logs: https://app.supabase.com/project/tbekcbbaxketpnztydvl/logs/functions

## Using Mailgun Sandbox Domain (for testing)

If using the sandbox domain (e.g., `sandbox123.mailgun.org`):
- You can **only send to authorized recipients**
- Go to: https://app.mailgun.com/app/sending/domains/[your-sandbox]/recipients
- Add your email address as an authorized recipient
- Verify it via the email Mailgun sends you

## Using Your Own Domain (for production)

1. Add your domain in Mailgun: https://app.mailgun.com/app/sending/domains
2. Add the required DNS records to your domain provider
3. Wait for verification (usually 5-10 minutes)
4. Update `MAILGUN_DOMAIN` in both `.env.local` and Supabase secrets

## How the Email System Works

The edge functions try providers in this order:
1. **Resend** (if `RESEND_API_KEY` is set)
2. **SendGrid** (if `SENDGRID_API_KEY` is set)
3. **Mailgun** (if `MAILGUN_API_KEY` and `MAILGUN_DOMAIN` are set)

Since you only set up Mailgun, it will automatically use that!

## Troubleshooting

### "No email provider configured"
- Make sure you set `MAILGUN_API_KEY` **and** `MAILGUN_DOMAIN` as Supabase secrets
- Check secrets: `npx supabase secrets list --project-ref tbekcbbaxketpnztydvl`

### Emails not arriving
1. Check Mailgun logs: https://app.mailgun.com/app/logs
2. If using sandbox domain, make sure your email is authorized
3. Check spam folder
4. View Supabase function logs for errors

### "Mailgun failed: 401 Unauthorized"
- Double-check your API key is correct
- Make sure you're using the **Private API key**, not the public one

### "Mailgun failed: 400 Bad Request"
- Check your domain is correct
- If using sandbox, make sure recipient is authorized

## View Edge Function Logs

To see detailed logs of what's happening:

```bash
# View send-alert-email logs
npx supabase functions logs send-alert-email --project-ref tbekcbbaxketpnztydvl

# View send-confirmation-email logs
npx supabase functions logs send-confirmation-email --project-ref tbekcbbaxketpnztydvl
```

Or in the dashboard:
https://app.supabase.com/project/tbekcbbaxketpnztydvl/logs/functions

## Quick Test Command

Test the API directly:

```bash
curl -X POST http://localhost:3000/api/alerts \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-authorized-email@example.com",
    "dates": ["2025-10-16"],
    "timeOfDay": "any",
    "quantity": 2,
    "minCapacity": 1
  }'
```

Check your email - you should receive a confirmation email via Mailgun!

## That's It!

Once you've added the credentials and secrets, emails will be sent through Mailgun automatically. The edge functions handle everything! 🎉
