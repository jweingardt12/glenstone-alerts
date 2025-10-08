# 🎨 Glenstone Ticket Alerts

A beautiful, modern web application for monitoring Glenstone Museum ticket availability and receiving alerts when tickets become available for your preferred dates.

![Next.js](https://img.shields.io/badge/Next.js-15-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4)
![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-latest-000000)

## ✨ Features

- **📅 Real-Time Availability Calendar**: View ticket availability for the next 60 days at a glance
- **🎯 Smart Alerts**: Set up email notifications for specific dates and party sizes
- **📊 Capacity Tracking**: See available slots and capacity percentages for each date
- **🔗 Quick Booking**: Direct links to the official Glenstone booking page
- **🎨 Beautiful UI**: Built with shadcn/ui components and Tailwind CSS
- **⚡ Fast & Responsive**: Optimized performance with Next.js 15

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- (Optional) Email service API key for notifications

### Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment variables** (optional)
   ```bash
   cp .env.example .env.local
   ```

   Add your configuration:
   ```env
   # Optional: For securing the cron endpoint
   CRON_SECRET=your-secret-key-here

   # Optional: For production email notifications
   SENDGRID_API_KEY=your-sendgrid-key
   # or
   RESEND_API_KEY=your-resend-key
   ```

3. **Run the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📖 Usage

### Viewing Availability

1. Select your party size from the dropdown
2. Browse the calendar to see available dates
3. Click "Book Now" on any available date to go to the official booking page

### Setting Up Alerts

1. Click the "Create Alert" button
2. Enter your email address
3. Select one or more dates you're interested in
4. Choose your party size and preferences
5. Submit the form

You'll receive an email notification when tickets become available for your selected dates.

## 🔧 Configuration

### Cron Job Setup

To enable automatic alert checking, you need to set up a cron job. Here are three options:

#### Option 1: Vercel Cron (Recommended for Vercel Deployment)

Create `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/check-alerts",
    "schedule": "*/15 * * * *"
  }]
}
```

#### Option 2: External Cron Service

Use a free service like [cron-job.org](https://cron-job.org) or [EasyCron](https://easycron.com):

1. Create a new cron job
2. Set URL: `https://your-domain.com/api/cron/check-alerts`
3. Set schedule: Every 15 minutes
4. Add header: `Authorization: Bearer your-cron-secret`

#### Option 3: Manual Testing

For development, you can manually trigger the cron:
```bash
curl http://localhost:3000/api/cron/check-alerts
```

### Email Service Setup

The app includes a mock email service that logs to console. For production:

1. **Choose an email service**:
   - [SendGrid](https://sendgrid.com) (12k emails/month free)
   - [Resend](https://resend.com) (3k emails/month free)
   - [AWS SES](https://aws.amazon.com/ses/)
   - [Postmark](https://postmarkapp.com)

2. **Update `/lib/notifications.ts`**:
   - Uncomment and configure the email sending code
   - Add your API key to `.env.local`

3. **Example with SendGrid**:
   ```typescript
   const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
     method: 'POST',
     headers: {
       'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
       'Content-Type': 'application/json',
     },
     body: JSON.stringify({
       personalizations: [{ to: [{ email: params.to }] }],
       from: { email: 'alerts@yourdomain.com' },
       subject: params.subject,
       content: [{ type: 'text/html', value: params.html }],
     }),
   });
   ```

### Database Setup with Supabase

The app now uses **Supabase** for persistent PostgreSQL storage with production-ready features.

**Quick Setup:**

1. Create a [Supabase account](https://app.supabase.com)
2. Create a new project
3. Copy `.env.example` to `.env.local` and add your Supabase credentials
4. Run the database migration (see [SUPABASE_SETUP.md](SUPABASE_SETUP.md))

**What's Included:**

- ✅ PostgreSQL database with `alerts` table
- ✅ Row Level Security (RLS) policies
- ✅ Indexed queries for performance
- ✅ Edge functions for email sending
- ✅ Automatic cleanup functions

**Full Setup Guide:** See [SUPABASE_SETUP.md](SUPABASE_SETUP.md) for detailed instructions on:
- Database migrations
- Edge functions deployment
- Email configuration with Resend
- Production deployment
- Troubleshooting

## 🏗️ Project Structure

```
glenstone-alerts/
├── app/
│   ├── api/
│   │   ├── availability/route.ts    # Fetch calendar data
│   │   ├── alerts/route.ts          # Alert CRUD operations
│   │   └── cron/check-alerts/route.ts  # Background job
│   ├── page.tsx                     # Main dashboard
│   └── layout.tsx                   # Root layout
├── components/
│   ├── ui/                          # shadcn/ui components
│   ├── availability-calendar.tsx    # Calendar view
│   └── alert-form.tsx               # Alert creation form
├── lib/
│   ├── types.ts                     # TypeScript types
│   ├── glenstone-api.ts            # API client
│   ├── db.ts                        # Supabase database layer
│   ├── supabase.ts                  # Supabase client
│   ├── notifications.ts             # Email service
│   └── utils.ts                     # Utilities
├── supabase/
│   ├── functions/
│   │   ├── send-alert-email/        # Edge function for alerts
│   │   └── send-confirmation-email/ # Edge function for confirmations
│   └── migrations/
│       └── 001_initial_schema.sql   # Database schema
└── public/                          # Static assets
```

## 🚢 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the project in [Vercel](https://vercel.com)
3. Add environment variables
4. Deploy

### Other Platforms

The app can be deployed to any platform supporting Next.js:
- [Netlify](https://netlify.com)
- [Railway](https://railway.app)
- [Render](https://render.com)
- [AWS Amplify](https://aws.amazon.com/amplify/)

## 🔐 Security Notes

1. **Protect the cron endpoint**: Use the `CRON_SECRET` environment variable
2. **Rate limiting**: Consider adding rate limiting to API routes
3. **Email validation**: The app validates email formats, but consider additional verification
4. **CORS**: Configure CORS policies for production
5. **Environment variables**: Never commit `.env.local` to git

## 📝 API Documentation

### GET `/api/availability?quantity=2`

Fetch calendar availability from Glenstone API.

**Query Parameters:**
- `quantity` (optional): Number of tickets (1-10, default: 2)

**Response:**
```json
{
  "calendar": {
    "_data": [
      {
        "date": "2025-10-16",
        "status": "available",
        "availability": {
          "capacity": 692,
          "used_capacity": 688
        }
      }
    ]
  }
}
```

### POST `/api/alerts`

Create a new availability alert.

**Request Body:**
```json
{
  "email": "user@example.com",
  "dates": ["2025-10-16", "2025-10-17"],
  "timeOfDay": "any",
  "quantity": 2,
  "minCapacity": 1
}
```

### GET `/api/cron/check-alerts`

Check all active alerts and send notifications.

**Headers:**
- `Authorization: Bearer ${CRON_SECRET}` (if configured)

## 🤝 Contributing

Contributions are welcome! This is a community project to help people access free museum tickets.

## ⚖️ Legal

- This is an **unofficial** tool and is **not affiliated** with Glenstone Museum
- Data is sourced from the public Glenstone ticketing API
- For official information, visit [glenstone.org](https://glenstone.org)
- Use responsibly and respect Glenstone's terms of service

## 📄 License

MIT License - feel free to use and modify for your own purposes.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org)
- UI components by [shadcn/ui](https://ui.shadcn.com)
- Styled with [Tailwind CSS](https://tailwindcss.com)
- Icons from [Lucide](https://lucide.dev)

## 📧 Support

If you encounter issues or have questions:
1. Check existing GitHub issues
2. Create a new issue with details
3. Contribute improvements via pull requests

---

Made with ❤️ for museum lovers
