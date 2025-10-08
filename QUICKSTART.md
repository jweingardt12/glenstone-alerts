# 🚀 Quick Start Guide

Get your Glenstone Ticket Alerts app running in 5 minutes!

## Step 1: Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Step 2: Test the Calendar

1. You should see a beautiful dashboard with the Glenstone Ticket Alerts header
2. The calendar will load automatically, showing available dates
3. Try changing the "Party Size" dropdown - the calendar will refresh
4. Click any "Book Now" button to open the Glenstone booking page

## Step 3: Create a Test Alert

1. Click the "Create Alert" button in the top-right
2. Enter your email address
3. Select one or more dates from the calendar
4. Choose your party size
5. Click "Create Alert"

**Note**: Emails won't actually be sent in dev mode - they'll be logged to the console.

## Step 4: Test the Cron Job

Open a new terminal and run:

```bash
curl http://localhost:3000/api/cron/check-alerts
```

You should see output showing how many alerts were checked. Look at your dev server console to see the "email" that would have been sent.

## Step 5: Test the API Endpoints

### Get availability for 2 people:
```bash
curl http://localhost:3000/api/availability?quantity=2
```

### Create an alert:
```bash
curl -X POST http://localhost:3000/api/alerts \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "dates": ["2025-10-16", "2025-10-17"],
    "timeOfDay": "any",
    "quantity": 2,
    "minCapacity": 1
  }'
```

### Get all alerts:
```bash
curl http://localhost:3000/api/alerts
```

## What You'll See

### Dashboard Features
- **Header**: Sticky header with title and "Create Alert" button
- **Info Card**: Blue card with info about Glenstone
- **Party Size Selector**: Dropdown to choose 1-10 tickets
- **Calendar Grid**: Cards showing each date's availability
- **Status Badges**: Green (available), Yellow (low), Red (sold out)
- **Capacity Info**: Shows available slots and percentage
- **Book Now Buttons**: Quick links to official booking page

### Alert Form
- **Email Input**: With validation
- **Calendar Picker**: Multi-date selection
- **Time Preference**: Morning/Midday/Afternoon/Any
- **Party Size**: Number input
- **Min Capacity**: Optional threshold

### Features Section
- Three cards explaining the app's features
- Links to Glenstone.org
- Professional footer

## Common Issues & Solutions

### Calendar Not Loading?
- Check the console for API errors
- Verify you have internet connection
- The Glenstone API might be temporarily unavailable

### Alert Form Not Working?
- Check email format is valid
- Ensure at least one date is selected
- Party size must be 1-10

### Build Errors?
```bash
# Clear cache and reinstall
rm -rf .next node_modules
npm install
npm run build
```

## Next Steps

1. **Deploy to Vercel**
   - Push to GitHub
   - Connect to Vercel
   - Deploy with one click

2. **Enable Email Notifications**
   - Sign up for SendGrid or Resend
   - Add API key to `.env.local`
   - Update `lib/notifications.ts`

3. **Set Up Automated Checking**
   - Vercel: Already configured in `vercel.json`
   - Or use cron-job.org to ping `/api/cron/check-alerts`

## Understanding the Code

### Main Files to Know

1. **`app/page.tsx`** - The main dashboard UI
2. **`components/availability-calendar.tsx`** - The calendar display
3. **`components/alert-form.tsx`** - The alert creation modal
4. **`lib/glenstone-api.ts`** - API client for Glenstone
5. **`lib/db.ts`** - Database layer (in-memory for demo)
6. **`lib/notifications.ts`** - Email service (mock in dev)
7. **`app/api/*/route.ts`** - All API endpoints

### How It Works

1. **Frontend** fetches availability from `/api/availability`
2. **API route** proxies request to Glenstone's API
3. **Calendar component** displays the data with color coding
4. **Alert form** creates alerts stored in memory
5. **Cron job** checks alerts every 15 minutes
6. **Email service** sends notifications when matches found

## Tips

- **Colors**: Green = lots available, Yellow = almost full, Red = sold out
- **Refresh**: Click the "Refresh" button to get latest data
- **Booking**: Always book directly on glenstone.org
- **Alerts**: Create multiple alerts for different dates
- **Party Size**: Larger groups have fewer available slots

## What's Working Right Now

✅ Real-time availability from Glenstone API
✅ Beautiful, responsive UI
✅ Alert creation and storage
✅ Email template generation (console logging)
✅ Cron job for checking alerts
✅ Direct booking links
✅ All API endpoints

## What Needs Production Setup

⚠️ Real email service (currently console only)
⚠️ Persistent database (currently in-memory)
⚠️ Rate limiting for API routes
⚠️ Analytics (optional)
⚠️ User authentication (optional)

---

## 🎉 You're Ready!

Your Glenstone Ticket Alerts app is fully functional. Enjoy!

**Questions?** Check the [README.md](README.md) for detailed documentation.
