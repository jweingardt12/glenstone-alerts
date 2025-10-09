# Glenstone Alerts

A web application that monitors [Glenstone Museum](https://glenstone.org) ticket availability and sends email alerts when tickets become available for your preferred dates.

![Next.js](https://img.shields.io/badge/Next.js-15-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4)

## What is this?

Glenstone Museum offers free admission with advance reservation. Tickets are released monthly and often fill up quickly. This tool helps you secure tickets by:

1. **Monitoring availability** - Checks Glenstone's public API every 30 minutes
2. **Sending email alerts** - Notifies you when tickets become available for your selected dates
3. **Showing weather forecasts** - Helps you plan your visit with weather information
4. **Providing direct booking links** - Quick access to reserve tickets on Glenstone.org

## How it works

### For visitors

1. Visit the site and browse the availability calendar
2. Click "Create Alert" and select your preferred dates
3. Enter your email address and party size
4. Receive email notifications when tickets become available
5. Click the booking link in the email to reserve on Glenstone.org

### Behind the scenes

- **Frontend**: Next.js 15 with React Server Components, styled with Tailwind CSS and shadcn/ui
- **Backend**: Supabase (PostgreSQL) for alert storage
- **Cron Jobs**: Supabase pg_cron checks availability every 30 minutes
- **Email**: Mailgun for transactional emails
- **Weather**: Apple WeatherKit API for forecasts
- **Analytics**: OpenPanel for privacy-friendly analytics
- **Deployment**: Vercel for hosting

The app uses Glenstone's public ticketing API to check availability and never interacts with the booking system directly.

## Features

- **Real-time calendar view** - See availability for the next 60 days at a glance
- **Smart alerts** - Set multiple date preferences with party size and time-of-day filters
- **Weather integration** - View temperature and precipitation forecasts for available dates
- **Alert management** - Update, pause, or delete alerts via email management links
- **Notification cooldown** - 24-hour gap between alerts to avoid spam
- **Responsive design** - Works seamlessly on desktop and mobile

## Development Setup

To run this project locally, you'll need to set up the following environment variables in a `.env.local` file:

```bash
# OpenPanel Analytics
NEXT_PUBLIC_OPENPANEL_CLIENT_ID=your_openpanel_client_id

# Other required environment variables
# (Supabase, Mailgun, WeatherKit, etc.)
```

### Analytics Events Tracked

The application tracks the following anonymous events via OpenPanel:

- **Alert Actions**: `alert_created`, `alert_deleted`, `alerts_deleted_all`
- **User Interactions**: `booking_link_clicked`, `availability_refreshed`, `time_slot_viewed`, `alert_modal_opened`, `theme_toggled`

All tracking is privacy-friendly with no user identification.

## Legal

This is an **unofficial** tool and is **not affiliated with or endorsed by** Glenstone Museum.

- Data is sourced from Glenstone's public ticketing API
- This tool only monitors availability and sends notifications
- All bookings are made directly on [glenstone.org](https://glenstone.org)
- For official information, visit [glenstone.org](https://glenstone.org)

## License

MIT License - See [LICENSE](LICENSE) for details.

---

Built with ❤️ for museum lovers
