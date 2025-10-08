# 🔧 Email Setup Troubleshooting Guide

## Current Issues

Based on your configuration, emails aren't sending because:

1. ❌ Missing `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`
2. ❌ No real Resend API key configured
3. ❌ Edge functions don't have access to Resend API key

## Quick Fix Steps

### Step 1: Get Your Supabase Service Role Key

1. Go to: https://app.supabase.com/project/tbekcbbaxketpnztydvl/settings/api
2. Scroll down to "Project API keys"
3. Copy the **`service_role`** secret key (NOT the anon key)
4. Add it to your `.env.local`:
   ```env
   SUPABASE_SERVICE_ROLE_KEY=eyJhbG...your-key-here
   ```

⚠️ **IMPORTANT**: Keep this key secret! Never commit it to git.

### Step 2: Sign Up for Resend (Free Email Service)

1. Go to: https://resend.com
2. Sign up for a free account (100 emails/day free)
3. Verify your email
4. Go to: https://resend.com/api-keys
5. Click "Create API Key"
6. Name it: "glenstone-alerts"
7. Copy the API key (starts with `re_`)

### Step 3: Configure Email Domain

**Option A: Use Resend's Test Domain (Quick Start)**
- You can send to any email you own
- Emails will come from `onboarding@resend.dev`
- Just use the API key, no domain verification needed

**Option B: Use Your Own Domain (Recommended for Production)**
1. Go to: https://resend.com/domains
2. Click "Add Domain"
3. Enter your domain (e.g., `yourdomain.com`)
4. Add the DNS records shown to your domain provider
5. Wait for verification (usually 5-10 minutes)
6. Update edge functions to use your domain (see Step 5)

### Step 4: Add Resend API Key to Local Environment

Update your `.env.local`:
```env
RESEND_API_KEY=re_your_actual_api_key_here
```

### Step 5: Configure Supabase Edge Function Secrets

The edge functions need access to your Resend API key. Run this command:

```bash
npx supabase secrets set RESEND_API_KEY=re_your_actual_api_key_here --project-ref tbekcbbaxketpnztydvl
```

Or set it via the Supabase dashboard:
1. Go to: https://app.supabase.com/project/tbekcbbaxketpnztydvl/settings/functions
2. Click "Manage secrets"
3. Add secret:
   - Name: `RESEND_API_KEY`
   - Value: `re_your_actual_api_key_here`
4. Click "Save"

### Step 6: Update "From" Email Address (If Using Custom Domain)

If you verified your own domain in Step 3, update the edge functions:

Edit both files:
- `supabase/functions/send-alert-email/index.ts`
- `supabase/functions/send-confirmation-email/index.ts`

Change line ~165 and ~122:
```typescript
from: "Glenstone Alerts <alerts@your-verified-domain.com>",
```

Then redeploy:
```bash
npm run deploy:functions
```

Or manually redeploy via dashboard.

### Step 7: Restart Your Dev Server

```bash
# Kill the current dev server (Ctrl+C)
npm run dev
```

## Testing Email Sending

### Test 1: Create an Alert

1. Go to http://localhost:3000
2. Click "Create Alert"
3. Enter your email
4. Select a date
5. Submit

**Expected Result:**
- Alert saved to database ✅
- Confirmation email sent to your inbox 📧

**Check Console:**
- Look for any error messages in browser console (F12)
- Check terminal for API errors

### Test 2: Check Supabase Logs

View edge function logs:
```bash
npx supabase functions logs send-confirmation-email --project-ref tbekcbbaxketpnztydvl
```

Or in dashboard:
https://app.supabase.com/project/tbekcbbaxketpnztydvl/logs/functions

### Test 3: Manual Edge Function Test

Test the edge function directly:
```bash
curl -X POST \
  "https://tbekcbbaxketpnztydvl.supabase.co/functions/v1/send-confirmation-email" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "alert": {
      "id": "test-123",
      "email": "your-email@example.com",
      "dates": ["2025-10-16"],
      "timeOfDay": "any",
      "quantity": 2
    }
  }'
```

## Common Issues & Solutions

### Issue: "RESEND_API_KEY not configured"

**Solution:** Make sure you set the secret in Supabase (Step 5)

### Issue: "Failed to send email: 403 Forbidden"

**Solutions:**
1. Check your Resend API key is valid
2. If using custom domain, make sure it's verified
3. Check you're not exceeding free tier limits (100/day)

### Issue: "Missing Supabase environment variables"

**Solution:** Add `SUPABASE_SERVICE_ROLE_KEY` to `.env.local` (Step 1)

### Issue: Emails not arriving

**Check:**
1. Spam folder
2. Email address is correct
3. Resend dashboard for delivery status: https://resend.com/emails
4. Edge function logs for errors

### Issue: "Cannot find module @supabase/supabase-js"

**Solution:**
```bash
npm install
```

## Development Mode (No Real Emails)

If you want to test without setting up Resend:

1. Set in `.env.local`:
   ```env
   USE_SUPABASE_EDGE_FUNCTIONS=false
   ```

2. Emails will be logged to console instead of sent

3. Check terminal output to see the email HTML

## Verify Everything is Working

Run this checklist:

- [ ] `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`
- [ ] Real Resend API key in `.env.local`
- [ ] `RESEND_API_KEY` set as Supabase secret
- [ ] `USE_SUPABASE_EDGE_FUNCTIONS=true` in `.env.local`
- [ ] Dev server restarted
- [ ] Created test alert
- [ ] Checked spam folder
- [ ] Viewed Supabase function logs
- [ ] Verified alert in database

## Still Having Issues?

1. **Check browser console** (F12 → Console tab)
2. **Check terminal logs** (where `npm run dev` is running)
3. **Check Supabase logs**: https://app.supabase.com/project/tbekcbbaxketpnztydvl/logs
4. **Check Resend logs**: https://resend.com/emails

## Quick Test Command

Run this to test the entire flow:
```bash
# Test database connection
curl http://localhost:3000/api/alerts

# Create a test alert
curl -X POST http://localhost:3000/api/alerts \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@example.com",
    "dates": ["2025-10-16"],
    "timeOfDay": "any",
    "quantity": 2,
    "minCapacity": 1
  }'
```

Check your email inbox after running this!
