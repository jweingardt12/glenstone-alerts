// Supabase Edge Function for sending alert confirmation emails
// Deploy with: supabase functions deploy send-confirmation-email

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Types
interface Alert {
  id: string;
  email: string;
  dates: string[];
  timeOfDay?: string;
  preferredTimes?: string[];
  quantity: number;
  minCapacity?: number;
  // Optional management tokens for manage link
  managementToken?: string;
  management_token?: string;
}

interface RequestBody {
  type: 'confirmation' | 'management';
  alert?: Alert;
  email?: string;
  token?: string;
  alertsCount?: number;
}

// Helper to format dates
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// Generate management email HTML
function generateManagementEmail(email: string, token: string, alertsCount: number, baseUrl: string): string {
  const manageUrl = `${baseUrl}/manage/${token}`;

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Manage Your Alerts</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1c1917; margin: 0; padding: 0; background: #fafaf9;">
        <div style="max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 4px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); overflow: hidden; border: 1px solid #e7e5e4;">

          <!-- Header -->
          <div style="background: #1c1917; padding: 32px; border-bottom: 1px solid #e7e5e4;">
            <div style="text-align: center; margin-bottom: 24px;">
              <img src="https://tbekcbbaxketpnztydvl.supabase.co/storage/v1/object/public/images/email-logo.png" alt="Glenstone Alerts" style="width: 80px; height: 80px; border-radius: 8px;" />
            </div>
            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 300; letter-spacing: 0.025em;">Manage Your Alerts</h1>
            <p style="margin: 8px 0 0 0; color: #d6d3d1; font-size: 15px; font-weight: 300;">
              You already have ${alertsCount} alert${alertsCount !== 1 ? 's' : ''} set up
            </p>
          </div>

          <!-- Content -->
          <div style="padding: 32px;">
            <p style="margin: 0 0 24px 0; font-size: 15px; color: #57534e; font-weight: 400; line-height: 1.6;">
              We noticed you tried to create a new alert, but you already have alerts configured for <strong>${email}</strong>.
            </p>

            <p style="margin: 0 0 24px 0; font-size: 15px; color: #57534e; font-weight: 400; line-height: 1.6;">
              Click the button below to view and manage all your existing alerts. You can edit dates, change preferences, or delete alerts you no longer need.
            </p>

            <div style="text-align: center; margin: 32px 0 0 0;">
              <a href="${manageUrl}"
                 style="display: inline-block; padding: 14px 32px; background: #1c1917; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 15px; letter-spacing: 0.025em;">
                Manage My Alerts
              </a>
            </div>
            <p style="margin: 12px 0 0 0; color: #a8a29e; font-size: 13px; text-align: center; line-height: 1.5;">
              View, edit, pause, or delete your alerts anytime
            </p>

            <div style="margin-top: 32px; padding: 20px; background: #f5f5f4; border-radius: 4px; border: 1px solid #e7e5e4;">
              <p style="margin: 0; color: #57534e; font-size: 14px; font-weight: 400; line-height: 1.5;">
                <strong style="font-weight: 500; color: #1c1917;">Secure Link:</strong> This link is unique to your email address and allows you to manage all your alerts securely. Don't share it with others.
              </p>
            </div>

            <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e7e5e4;">
              <p style="margin: 0; color: #78716c; font-size: 14px; font-weight: 400; line-height: 1.5;">
                <strong style="font-weight: 500; color: #1c1917;">Note:</strong> If you want to add a new alert, you can do so from the management page after clicking the button above.
              </p>
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

// Generate confirmation email HTML
function generateConfirmationEmail(alert: Alert, manageUrl?: string): string {
  const datesList = alert.dates.map((date) => formatDate(date)).join(", ");

  return `
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
            <div style="text-align: center; margin-bottom: 24px;">
              <img src="https://tbekcbbaxketpnztydvl.supabase.co/storage/v1/object/public/images/email-logo.png" alt="Glenstone Alerts" style="width: 80px; height: 80px; border-radius: 8px;" />
            </div>
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
                ${alert.preferredTimes && alert.preferredTimes.length > 0 ? `
                <tr>
                  <td style="padding: 8px 0; color: #78716c; font-size: 14px;">Preferred Times</td>
                  <td style="padding: 8px 0; color: #1c1917; font-size: 14px; text-align: right;">${alert.preferredTimes.join(", ")}</td>
                </tr>
                ` : alert.timeOfDay && alert.timeOfDay !== "any" ? `
                <tr>
                  <td style="padding: 8px 0; color: #78716c; font-size: 14px;">Time Preference</td>
                  <td style="padding: 8px 0; color: #1c1917; font-size: 14px; text-align: right;">${alert.timeOfDay.charAt(0).toUpperCase() + alert.timeOfDay.slice(1)}</td>
                </tr>
                ` : ""}
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
    const body: RequestBody = await req.json();

    let recipientEmail: string;
    let subject: string;
    let html: string;

    if (body.type === 'management') {
      // Management email
      if (!body.email || !body.token || !body.alertsCount) {
        return new Response(
          JSON.stringify({ error: "Invalid request body for management email" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Get base URL from request headers or environment
      const originHeader = req.headers.get("origin");
      const baseUrl = originHeader || Deno.env.get("SITE_URL") || Deno.env.get("NEXT_PUBLIC_SITE_URL") || "https://glenstone-tracker.vercel.app";

      recipientEmail = body.email;
      subject = "📋 Manage Your Glenstone Alerts";
      html = generateManagementEmail(body.email, body.token, body.alertsCount, baseUrl);
    } else {
      // Confirmation email
      if (!body.alert || !body.alert.email || !body.alert.dates) {
        return new Response(
          JSON.stringify({ error: "Invalid request body for confirmation email" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Get base URL from request headers or environment
      const originHeader = req.headers.get("origin");
      const siteUrl = originHeader || Deno.env.get("SITE_URL") || Deno.env.get("NEXT_PUBLIC_SITE_URL") || "https://glenstone-tracker.vercel.app";

      // Build manage URL if alert has a management token
      const token = body.alert.managementToken ?? body.alert.management_token;
      const manageUrl = token ? `${siteUrl}/manage/${token}` : undefined;

      recipientEmail = body.alert.email;
      subject = "Glenstone Alert Created";
      html = generateConfirmationEmail(body.alert, manageUrl);
    }

    // Send email
    const sent = await sendEmail(recipientEmail, subject, html);

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
    console.error("Error in send-confirmation-email function:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});
