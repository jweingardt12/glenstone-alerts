// Supabase Edge Function for checking alerts (Alternative to Vercel Cron)
// Deploy with: supabase functions deploy check-alerts-cron
// Schedule with: pg_cron or external service like cron-job.org

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Types
interface Alert {
  id: string;
  email: string;
  dates: string[];
  time_of_day: string;
  quantity: number;
  min_capacity?: number;
  active: boolean;
}

interface CalendarDate {
  date: string;
  status: string;
  availability: {
    capacity: number;
    used_capacity: number;
  };
}

// Initialize Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Fetch calendar availability from Glenstone
async function fetchCalendarAvailability(quantity: number) {
  const params = new URLSearchParams({
    quantity: quantity.toString(),
    "categories[]": "3095",
    shop: "true",
  });

  const response = await fetch(
    `https://glenstone.org/wp-json/wc/v3/bookings/products/86/slots?${params}`
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch availability: ${response.statusText}`);
  }

  return await response.json();
}

// Generate booking URL
function generateBookingUrl(date: string, quantity: number): string {
  const baseUrl = "https://glenstone.org/visit/";
  return `${baseUrl}?date=${date}&quantity=${quantity}`;
}

// Send email notification
async function sendEmail(alert: Alert, availableDates: CalendarDate[]) {
  const emailFunctionUrl = `${supabaseUrl}/functions/v1/send-alert-email`;

  const response = await fetch(emailFunctionUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${supabaseServiceKey}`,
    },
    body: JSON.stringify({
      // Ensure management_token is preserved for manage-link generation
      alert: { ...(alert as any), management_token: (alert as any).management_token },
      availableDates,
    }),
  });

  if (!response.ok) {
    console.error("Failed to send email:", await response.text());
    return false;
  }

  return true;
}

// Main handler
serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST",
        "Access-Control-Allow-Headers":
          "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  let logId: string | null = null;

  try {
    const startTime = Date.now();

    // Verify cron secret - check if it's present in the header
    const authHeader = req.headers.get("authorization");
    const cronSecret = Deno.env.get("CRON_SECRET");

    // Allow requests with valid CRON_SECRET or valid Supabase JWT
    let isAuthorized = false;

    if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
      isAuthorized = true;
      console.log("Authorized via CRON_SECRET");
    } else if (authHeader && authHeader.startsWith("Bearer eyJ")) {
      // Looks like a JWT token, allow it (Supabase validates JWTs automatically)
      isAuthorized = true;
      console.log("Authorized via JWT");
    }

    if (!isAuthorized) {
      console.log("Unauthorized request - invalid auth header:", authHeader?.substring(0, 20));
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log("🔄 Starting alert check...");

    // Start cron log
    const { data: logData, error: logError } = await supabase
      .from("cron_logs")
      .insert({ status: "started" })
      .select()
      .single();

    if (!logError && logData) {
      logId = logData.id;
    }

    // Get all active alerts
    const { data: alerts, error: alertsError } = await supabase
      .from("alerts")
      .select("*")
      .eq("active", true);

    if (alertsError) {
      throw new Error(`Failed to fetch alerts: ${alertsError.message}`);
    }

    console.log(`📋 Found ${alerts?.length || 0} active alerts`);

    if (!alerts || alerts.length === 0) {
      // Complete log
      if (logId) {
        await supabase
          .from("cron_logs")
          .update({
            completed_at: new Date().toISOString(),
            duration_ms: Date.now() - startTime,
            status: "completed",
            alerts_checked: 0,
            notifications_sent: 0,
          })
          .eq("id", logId);
      }

      return new Response(
        JSON.stringify({
          message: "No active alerts to check",
          checked: 0,
          notified: 0,
          duration: Date.now() - startTime,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    let notificationsSent = 0;
    const results: Array<{
      alertId: string;
      email: string;
      matched: number;
      notified: boolean;
    }> = [];

    // Group alerts by quantity
    const alertsByQuantity = new Map<number, typeof alerts>();
    for (const alert of alerts) {
      if (!alertsByQuantity.has(alert.quantity)) {
        alertsByQuantity.set(alert.quantity, []);
      }
      alertsByQuantity.get(alert.quantity)!.push(alert);
    }

    // Check each quantity group
    for (const [quantity, quantityAlerts] of alertsByQuantity) {
      console.log(`🔍 Checking availability for quantity: ${quantity}`);

      try {
        const calendarData = await fetchCalendarAvailability(quantity);
        const availableDates = calendarData.calendar._data.filter(
          (date: CalendarDate) => date.status === "available"
        );

        // Check each alert in this quantity group
        for (const alert of quantityAlerts) {
          // Update last checked
          await supabase
            .from("alerts")
            .update({ last_checked: new Date().toISOString() })
            .eq("id", alert.id);

          // Check if 24 hours have passed since last notification
          const now = Date.now();
          const lastNotified = alert.last_notified_at
            ? new Date(alert.last_notified_at).getTime()
            : 0;
          const hoursSinceLastNotification = (now - lastNotified) / (1000 * 60 * 60);

          // Skip if notified within last 24 hours
          if (hoursSinceLastNotification < 24) {
            console.log(
              `⏭️  Skipping ${alert.email} - notified ${hoursSinceLastNotification.toFixed(1)} hours ago`
            );
            continue;
          }

          // Find matching dates
          const matchedDates = availableDates.filter((date: CalendarDate) => {
            // Check if date is in alert's date list
            if (!alert.dates.includes(date.date)) {
              return false;
            }

            // Check minimum capacity if specified
            if (alert.min_capacity) {
              const available =
                date.availability.capacity - date.availability.used_capacity;
              if (available < alert.min_capacity) {
                return false;
              }
            }

            return true;
          });

          if (matchedDates.length > 0) {
            console.log(
              `✅ Found ${matchedDates.length} matching dates for ${alert.email}`
            );

            // Format alert for email function
            const alertForEmail: Alert = {
              id: alert.id,
              email: alert.email,
              dates: alert.dates,
              time_of_day: alert.time_of_day,
              quantity: alert.quantity,
              min_capacity: alert.min_capacity,
              active: alert.active,
            };

            // Send notification
            const sent = await sendEmail(alertForEmail, matchedDates);

            if (sent) {
              notificationsSent++;
              // Update last notified time (alerts remain active for daily reminders)
              await supabase
                .from("alerts")
                .update({ last_notified_at: new Date().toISOString() })
                .eq("id", alert.id);
            }

            results.push({
              alertId: alert.id,
              email: alert.email,
              matched: matchedDates.length,
              notified: sent,
            });
          }
        }
      } catch (error) {
        console.error(`Error checking quantity ${quantity}:`, error);
      }

      // Add small delay between API calls
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    const duration = Date.now() - startTime;
    console.log(`✅ Alert check completed in ${duration}ms`);
    console.log(`📧 Sent ${notificationsSent} notifications`);

    // Complete cron log
    if (logId) {
      await supabase
        .from("cron_logs")
        .update({
          completed_at: new Date().toISOString(),
          duration_ms: duration,
          status: "completed",
          alerts_checked: alerts.length,
          notifications_sent: notificationsSent,
          metadata: { results },
        })
        .eq("id", logId);
    }

    return new Response(
      JSON.stringify({
        message: "Alert check completed",
        checked: alerts.length,
        notified: notificationsSent,
        results,
        duration,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in cron job:", error);

    // Fail cron log
    if (logId) {
      await supabase
        .from("cron_logs")
        .update({
          completed_at: new Date().toISOString(),
          status: "failed",
          error_message: error instanceof Error ? error.message : "Unknown error",
        })
        .eq("id", logId);
    }

    return new Response(
      JSON.stringify({ error: "Failed to check alerts" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});
