// Supabase Edge Function for sending alert emails
// Deploy with: supabase functions deploy send-alert-email

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Types
interface CalendarDate {
  date: string;
  status: string;
  availability: {
    capacity: number;
    used_capacity: number;
  };
}

interface Alert {
  id: string;
  email: string;
  dates: string[];
  timeOfDay?: string;
  preferredTimes?: string[];
  quantity: number;
  minCapacity?: number;
  // Optional management token (camelCase)
  managementToken?: string;
  // Optional management token (snake_case when coming directly from DB)
  management_token?: string;
}

interface DailyWeather {
  date: string;
  temperatureMax: number;
  temperatureMin: number;
  conditionCode: string;
  precipitationChance: number;
}

interface WeatherResponse {
  [date: string]: DailyWeather;
}

interface RequestBody {
  alert: Alert;
  availableDates: CalendarDate[];
}

// Helper to format dates
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// Generate booking URL
function generateBookingUrl(date: string, quantity: number): string {
  const baseUrl = "https://visit.glenstone.org/events/8c42a85b-0f1b-eee0-a921-8464481a74f6";
  return `${baseUrl}?date=${date}&quantity=${quantity ?? 2}`;
}

// Get weather icon emoji
function getWeatherIcon(conditionCode: string): string {
  const iconMap: Record<string, string> = {
    Clear: "☀️",
    MostlyClear: "🌤️",
    PartlyCloudy: "⛅",
    MostlyCloudy: "🌥️",
    Cloudy: "☁️",
    Rain: "🌧️",
    Drizzle: "🌦️",
    HeavyRain: "⛈️",
    Snow: "❄️",
    Sleet: "🌨️",
    Hail: "🧊",
    Thunderstorms: "⛈️",
    ScatteredThunderstorms: "🌩️",
    Windy: "💨",
    Breezy: "🍃",
    Foggy: "🌫️",
    Haze: "😶‍🌫️",
  };
  return iconMap[conditionCode] || "🌡️";
}

// Fetch weather data from main site
async function fetchWeather(dates: string[]): Promise<WeatherResponse> {
  if (dates.length === 0) return {};

  try {
    const startDate = dates[0];
    const endDate = dates[dates.length - 1];

    // Call the main site's weather API
    const siteUrl = Deno.env.get("SITE_URL") || Deno.env.get("NEXT_PUBLIC_SITE_URL") || "https://glenstone-tracker.vercel.app";
    const response = await fetch(
      `${siteUrl}/api/weather?startDate=${startDate}&endDate=${endDate}`
    );

    if (!response.ok) {
      console.error("Failed to fetch weather:", response.statusText);
      return {};
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching weather:", error);
    return {};
  }
}

// Generate email HTML
function generateAvailabilityEmail(
  alert: Alert,
  availableDates: CalendarDate[],
  weatherData: WeatherResponse,
  manageUrl?: string
): string {
  const datesList = availableDates
    .map((date) => {
      const formattedDate = formatDate(date.date);
      const availableSlots =
        date.availability.capacity - date.availability.used_capacity;
      const bookingUrl = generateBookingUrl(date.date, alert.quantity);
      const weather = weatherData[date.date];

      let weatherHtml = "";
      if (weather) {
        const icon = getWeatherIcon(weather.conditionCode);
        const tempHigh = Math.round(weather.temperatureMax);
        const tempLow = Math.round(weather.temperatureMin);
        const precipChance = Math.round(weather.precipitationChance * 100);

        weatherHtml = `
          <p style="margin: 8px 0; color: #57534e; font-weight: 400; font-size: 14px;">
            <span style="color: #78716c;">Weather:</span> ${icon} ${tempHigh}°/${tempLow}°F${precipChance > 0 ? ` • ${precipChance}% rain` : ""}
          </p>
        `;
      }

      return `
        <div style="margin: 20px 0; padding: 20px; background: #ffffff; border-radius: 4px; border: 1px solid #e7e5e4;">
          <h3 style="margin: 0 0 12px 0; color: #1c1917; font-size: 18px; font-weight: 300; letter-spacing: 0.025em;">${formattedDate}</h3>
          <p style="margin: 8px 0; color: #57534e; font-weight: 400; font-size: 14px;">
            <span style="color: #78716c;">Available Slots:</span> ${availableSlots} / ${date.availability.capacity}
          </p>
          <p style="margin: 8px 0; color: #57534e; font-weight: 400; font-size: 14px;">
            <span style="color: #78716c;">Party Size:</span> ${alert.quantity}
          </p>
          ${weatherHtml}
          <a href="${bookingUrl}"
             style="display: inline-block; margin-top: 12px; padding: 10px 24px; background: #1c1917; color: #ffffff; text-decoration: none; border-radius: 4px; font-weight: 400; font-size: 14px; letter-spacing: 0.025em;">
            Book on Glenstone.org
          </a>
        </div>
      `;
    })
    .join("");

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Glenstone Tickets Available</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1c1917; margin: 0; padding: 0; background: #fafaf9;">
        <div style="max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 4px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); overflow: hidden; border: 1px solid #e7e5e4;">

          <!-- Header -->
          <div style="background: #1c1917; padding: 32px; border-bottom: 1px solid #e7e5e4;">
            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 300; letter-spacing: 0.025em;">
              Glenstone Tickets Available
            </h1>
            <p style="margin: 8px 0 0 0; color: #d6d3d1; font-size: 15px; font-weight: 300;">
              Tickets are now available for your selected dates
            </p>
          </div>

          <!-- Content -->
          <div style="padding: 32px;">
            <p style="margin: 0 0 24px 0; font-size: 15px; color: #57534e; font-weight: 400; line-height: 1.6;">
              You're receiving this email because you set up an alert for Glenstone admission tickets. The following dates now have availability:
            </p>

            ${datesList}

            ${manageUrl ? `
            <div style="text-align: center; margin: 32px 0 0 0;">
              <a href="${manageUrl}"
                 style="display: inline-block; padding: 14px 32px; background: #1c1917; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 15px; letter-spacing: 0.025em;">
                Manage My Alerts
              </a>
            </div>
            <p style="margin: 12px 0 0 0; color: #a8a29e; font-size: 13px; text-align: center; line-height: 1.5;">
              View, edit, pause, or delete your alerts anytime
            </p>
            ` : ""}

            <div style="margin-top: 32px; padding: 20px; background: #f5f5f4; border-radius: 4px; border: 1px solid #e7e5e4;">
              <p style="margin: 0; color: #57534e; font-size: 14px; font-weight: 400; line-height: 1.5;">
                <strong style="font-weight: 500; color: #1c1917;">Note:</strong> Glenstone tickets are popular and may sell out quickly. We recommend booking as soon as possible.
              </p>
            </div>

            <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e7e5e4;">
              <p style="margin: 0 0 12px 0; font-size: 13px; color: #78716c; font-weight: 500; text-transform: uppercase; letter-spacing: 0.05em;">
                Alert Details
              </p>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 6px 0; color: #78716c; font-size: 14px;">Party Size</td>
                  <td style="padding: 6px 0; color: #1c1917; font-size: 14px; text-align: right;">${alert.quantity} ${alert.quantity === 1 ? "person" : "people"}</td>
                </tr>
                ${alert.preferredTimes && alert.preferredTimes.length > 0 ? `
                <tr>
                  <td style="padding: 6px 0; color: #78716c; font-size: 14px;">Preferred Times</td>
                  <td style="padding: 6px 0; color: #1c1917; font-size: 14px; text-align: right;">${alert.preferredTimes.join(", ")}</td>
                </tr>
                ` : alert.timeOfDay && alert.timeOfDay !== "any" ? `
                <tr>
                  <td style="padding: 6px 0; color: #78716c; font-size: 14px;">Time Preference</td>
                  <td style="padding: 6px 0; color: #1c1917; font-size: 14px; text-align: right;">${alert.timeOfDay.charAt(0).toUpperCase() + alert.timeOfDay.slice(1)}</td>
                </tr>
                ` : ""}
                ${alert.minCapacity ? `
                <tr>
                  <td style="padding: 6px 0; color: #78716c; font-size: 14px;">Minimum Capacity</td>
                  <td style="padding: 6px 0; color: #1c1917; font-size: 14px; text-align: right;">${alert.minCapacity} slots</td>
                </tr>
                ` : ""}
              </table>
            </div>
          </div>

          <!-- Footer -->
          <div style="background: #fafaf9; padding: 24px 32px; border-top: 1px solid #e7e5e4;">
            <p style="margin: 0; color: #78716c; font-size: 13px; text-align: center; line-height: 1.5;">
              Automated notification from Glenstone Ticket Alerts
              <br>
              <a href="https://glenstone.org" style="color: #1c1917; text-decoration: none; font-weight: 400;">Visit Glenstone.org</a>
              for official information
            </p>
            <p style="margin: 12px 0 0 0; color: #a8a29e; font-size: 12px; text-align: center; font-weight: 300;">
              Not affiliated with Glenstone Museum • Unofficial monitoring service
            </p>
          </div>
        </div>
      </body>
    </html>
  `;
}

// Send email via Resend or SendGrid
async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<boolean> {
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  const sendgridApiKey = Deno.env.get("SENDGRID_API_KEY");

  // Try Resend first
  if (resendApiKey) {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: "Glenstone Alerts <onboarding@resend.dev>",
          to: [to],
          subject: subject,
          html: html,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error("Resend failed:", error);
        // Fall through to try SendGrid
      } else {
        const result = await response.json();
        console.log("Email sent via Resend:", result);
        return true;
      }
    } catch (error) {
      console.error("Resend error:", error);
      // Fall through to try SendGrid
    }
  }

  // Try SendGrid as fallback
  if (sendgridApiKey) {
    try {
      const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sendgridApiKey}`,
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: to }] }],
          from: { email: "alerts@yourdomain.com", name: "Glenstone Alerts" },
          subject: subject,
          content: [{ type: "text/html", value: html }],
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error("SendGrid failed:", error);
        return false;
      }

      console.log("Email sent via SendGrid");
      return true;
    } catch (error) {
      console.error("SendGrid error:", error);
      return false;
    }
  }

  // Try Mailgun as final fallback
  const mailgunApiKey = Deno.env.get("MAILGUN_API_KEY");
  const mailgunDomain = Deno.env.get("MAILGUN_DOMAIN");

  if (mailgunApiKey && mailgunDomain) {
    try {
      const auth = btoa(`api:${mailgunApiKey}`);
      const response = await fetch(
        `https://api.mailgun.net/v3/${mailgunDomain}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${auth}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            from: `Glenstone Alerts <alerts@${mailgunDomain}>`,
            to: to,
            subject: subject,
            html: html,
          }).toString(),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        console.error("Mailgun failed:", error);
        return false;
      }

      const result = await response.json();
      console.log("Email sent via Mailgun:", result);
      return true;
    } catch (error) {
      console.error("Mailgun error:", error);
      return false;
    }
  }

  console.error("No email provider configured. Set RESEND_API_KEY, SENDGRID_API_KEY, or MAILGUN_API_KEY");
  return false;
}

// Main handler
serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    const { alert, availableDates }: RequestBody = await req.json();

    // Validate input
    if (!alert || !availableDates || !Array.isArray(availableDates)) {
      return new Response(
        JSON.stringify({ error: "Invalid request body" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Fetch weather data for available dates
    const dates = availableDates.map(d => d.date).sort();
    const weatherData = await fetchWeather(dates);

    // Build manage URL if token is present
    const token = (alert as any).managementToken ?? (alert as any).management_token;
    const originHeader = req.headers.get("origin");
    const siteUrl = originHeader || Deno.env.get("SITE_URL") || Deno.env.get("NEXT_PUBLIC_SITE_URL") || "https://glenstone-tracker.vercel.app";
    const manageUrl = token ? `${siteUrl}/manage/${token}` : undefined;
    console.log("send-alert-email: manageUrl:", manageUrl);

    // Generate email content
    const subject = `Glenstone Tickets Available - ${availableDates.length} date${availableDates.length !== 1 ? "s" : ""} now open`;
    const html = generateAvailabilityEmail(alert, availableDates, weatherData, manageUrl);

    // Send email
    const sent = await sendEmail(alert.email, subject, html);

    if (sent) {
      return new Response(
        JSON.stringify({ success: true, message: "Email sent successfully" }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    } else {
      return new Response(
        JSON.stringify({ success: false, error: "Failed to send email" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    console.error("Error in send-alert-email function:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});
