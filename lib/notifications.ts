import type { Alert, CalendarDate } from "./types";
import { format, parseISO } from "date-fns";
import { generateBookingUrl } from "./glenstone-api";

/**
 * Email notification service
 * In production, this would integrate with services like:
 * - SendGrid
 * - AWS SES
 * - Resend
 * - Postmark
 * etc.
 */

interface EmailParams {
  to: string;
  subject: string;
  html: string;
}

/**
 * Mock email sender (logs to console for demo)
 * Replace with actual email service in production
 */
async function sendEmail(params: EmailParams): Promise<boolean> {
  console.log("📧 Email would be sent:");
  console.log("To:", params.to);
  console.log("Subject:", params.subject);
  console.log("HTML:", params.html);

  // In production, implement actual email sending:
  /*
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
  return response.ok;
  */

  return true;
}

/**
 * Generate email HTML for availability alert
 */
function generateAvailabilityEmail(
  alert: Alert,
  availableDates: CalendarDate[]
): string {
  const datesList = availableDates
    .map((date) => {
      const formattedDate = format(parseISO(date.date), "EEEE, MMMM d, yyyy");
      const availableSlots =
        date.availability.capacity - date.availability.used_capacity;
      const bookingUrl = generateBookingUrl(date.date, alert.quantity);

      return `
        <div style="margin: 20px 0; padding: 20px; background: #ffffff; border-radius: 4px; border: 1px solid #e7e5e4;">
          <h3 style="margin: 0 0 12px 0; color: #1c1917; font-size: 18px; font-weight: 300; letter-spacing: 0.025em;">${formattedDate}</h3>
          <p style="margin: 8px 0; color: #57534e; font-weight: 400; font-size: 14px;">
            <span style="color: #78716c;">Available Slots:</span> ${availableSlots} / ${date.availability.capacity}
          </p>
          <p style="margin: 8px 0; color: #57534e; font-weight: 400; font-size: 14px;">
            <span style="color: #78716c;">Party Size:</span> ${alert.quantity}
          </p>
          <a href="${bookingUrl}"
             style="display: inline-block; margin-top: 12px; padding: 10px 24px; background: #1c1917; color: #ffffff; text-decoration: none; border-radius: 4px; font-weight: 400; font-size: 14px; letter-spacing: 0.025em;">
            Book on Glenstone.org
          </a>
        </div>
      `;
    })
    .join("");

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  const manageUrl = alert.managementToken ? `${siteUrl}/manage/${alert.managementToken}` : undefined;

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
            <div style="text-align: center; margin: 28px 0 6px 0;">
              <a href="${manageUrl}"
                 style="display: inline-block; padding: 10px 20px; background: #0c0a09; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 14px; letter-spacing: 0.02em;">
                Manage My Alerts
              </a>
            </div>
            <p style=\"margin: 0; color: #a8a29e; font-size: 12px; text-align: center;\">This link lets you view, pause, or delete alerts.</p>
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
                <tr>
                  <td style="padding: 6px 0; color: #78716c; font-size: 14px;">Time Preference</td>
                  <td style="padding: 6px 0; color: #1c1917; font-size: 14px; text-align: right;">${alert.timeOfDay === "any" ? "Any time" : alert.timeOfDay.charAt(0).toUpperCase() + alert.timeOfDay.slice(1)}</td>
                </tr>
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

/**
 * Send availability alert to user
 */
export async function sendAvailabilityAlert(
  alert: Alert,
  availableDates: CalendarDate[]
): Promise<boolean> {
  // Option 1: Use Supabase Edge Function (recommended for production)
  const useEdgeFunction = process.env.USE_SUPABASE_EDGE_FUNCTIONS === "true";

  if (useEdgeFunction) {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-alert-email`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          },
          body: JSON.stringify({ alert, availableDates }),
        }
      );

      if (!response.ok) {
        console.error("Edge function failed:", await response.text());
        return false;
      }

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error("Error calling edge function:", error);
      return false;
    }
  }

  // Option 2: Use mock email (default for development)
  const subject = `Glenstone Tickets Available - ${availableDates.length} date${availableDates.length !== 1 ? "s" : ""} now open`;
  const html = generateAvailabilityEmail(alert, availableDates);

  return sendEmail({
    to: alert.email,
    subject,
    html,
  });
}

/**
 * Send confirmation email when alert is created
 */
export async function sendAlertConfirmation(alert: Alert): Promise<boolean> {
  // Option 1: Use Supabase Edge Function (recommended for production)
  const useEdgeFunction = process.env.USE_SUPABASE_EDGE_FUNCTIONS === "true";

  if (useEdgeFunction) {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-confirmation-email`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          },
          body: JSON.stringify({ alert }),
        }
      );

      if (!response.ok) {
        console.error("Edge function failed:", await response.text());
        return false;
      }

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error("Error calling edge function:", error);
      return false;
    }
  }

  // Option 2: Use mock email (default for development)
  const datesList = alert.dates
    .map((date) => format(parseISO(date), "MMMM d, yyyy"))
    .join(", ");

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  const manageUrl = alert.managementToken ? `${siteUrl}/manage/${alert.managementToken}` : undefined;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Alert Created</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1c1917; margin: 0; padding: 0; background: #fafaf9;">
        <div style="max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 4px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); overflow: hidden; border: 1px solid #e7e5e4;">

          <!-- Header -->
          <div style="background: #1c1917; padding: 32px; border-bottom: 1px solid #e7e5e4;">
            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 300; letter-spacing: 0.025em;">Alert Created</h1>
            <p style="margin: 8px 0 0 0; color: #d6d3d1; font-size: 15px; font-weight: 300;">
              Your availability alert has been set up
            </p>
          </div>

          <!-- Content -->
          <div style="padding: 32px;">
            <p style="margin: 0 0 24px 0; font-size: 15px; color: #57534e; font-weight: 400; line-height: 1.6;">
              Your Glenstone availability alert has been successfully created. We'll monitor availability and notify you as soon as tickets become available.
            </p>

            <div style="margin: 24px 0; padding: 24px; background: #fafaf9; border-radius: 4px; border: 1px solid #e7e5e4;">
              <h3 style="margin: 0 0 16px 0; color: #1c1917; font-size: 16px; font-weight: 300; letter-spacing: 0.025em;">Alert Details</h3>

              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #78716c; font-size: 14px; vertical-align: top;">Dates</td>
                  <td style="padding: 8px 0; color: #1c1917; font-size: 14px; text-align: right;">${datesList}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #78716c; font-size: 14px;">Party Size</td>
                  <td style="padding: 8px 0; color: #1c1917; font-size: 14px; text-align: right;">${alert.quantity} ${alert.quantity === 1 ? "person" : "people"}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #78716c; font-size: 14px;">Time Preference</td>
                  <td style="padding: 8px 0; color: #1c1917; font-size: 14px; text-align: right;">${alert.timeOfDay === "any" ? "Any time" : alert.timeOfDay.charAt(0).toUpperCase() + alert.timeOfDay.slice(1)}</td>
                </tr>
                ${alert.minCapacity ? `
                <tr>
                  <td style="padding: 8px 0; color: #78716c; font-size: 14px;">Minimum Capacity</td>
                  <td style="padding: 8px 0; color: #1c1917; font-size: 14px; text-align: right;">${alert.minCapacity} slots</td>
                </tr>
                ` : ""}
              </table>
            </div>

            <p style="margin: 24px 0 0 0; color: #78716c; font-size: 14px; font-weight: 400; line-height: 1.5;">
              We check availability regularly and will send you an email notification when tickets become available for your selected dates.
            </p>

            ${manageUrl ? `
            <div style="text-align: center; margin: 28px 0 6px 0;">
              <a href="${manageUrl}"
                 style="display: inline-block; padding: 10px 20px; background: #0c0a09; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 14px; letter-spacing: 0.02em;">
                Manage My Alerts
              </a>
            </div>
            <p style="margin: 0; color: #a8a29e; font-size: 12px; text-align: center;">This link lets you view, pause, or delete alerts.</p>
            ` : ""}
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

  return sendEmail({
    to: alert.email,
    subject: "Glenstone Alert Created",
    html,
  });
}
