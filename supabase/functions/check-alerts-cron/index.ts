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
  time_of_day?: string;
  preferred_times?: string[];
  quantity: number;
  min_capacity?: number;
  active: boolean;
  management_token?: string;
  last_notified_at?: string;
}

interface CalendarDate {
  date: string;
  status: string;
  availability: {
    capacity: number;
    used_capacity: number;
  };
}

interface EventSession {
  id: string;
  start_datetime: string;
  end_datetime: string;
  capacity: number;
  used_capacity: number;
  sold_out: boolean;
}

// Initialize Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Glenstone API constants
const GLENSTONE_CONFIG = {
  BASE_URL: "https://visit.glenstone.org",
  EVENT_ID: "8c42a85b-0f1b-eee0-a921-8464481a74f6",
  TICKET_TYPE_ID: "66b9a9ca-39a1-7a8f-956d-0861a4e17c98",
};

// Fetch calendar availability from Glenstone
async function fetchCalendarAvailability(quantity: number) {
  const url = `${GLENSTONE_CONFIG.BASE_URL}/api/events/${GLENSTONE_CONFIG.EVENT_ID}/calendar?_format=extended`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      accept: "application/json, text/plain, */*",
      "content-type": "application/json",
      "tix-app": "ecomm",
    },
    body: JSON.stringify({
      ticket_types_required: [
        {
          ticket_type_id: GLENSTONE_CONFIG.TICKET_TYPE_ID,
          quantity,
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch availability: ${response.statusText}`);
  }

  return await response.json();
}

// Fetch day sessions from Glenstone
async function fetchDaySessions(date: string, quantity: number) {
  const url = `${GLENSTONE_CONFIG.BASE_URL}/api/events/${GLENSTONE_CONFIG.EVENT_ID}/sessions?_include_sold_out=true&_ondate=${date}&_sort=start_datetime`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      accept: "application/json, text/plain, */*",
      "content-type": "application/json",
      "tix-app": "ecomm",
    },
    body: JSON.stringify({
      ticket_types_required: [
        {
          ticket_type_id: GLENSTONE_CONFIG.TICKET_TYPE_ID,
          quantity,
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch sessions: ${response.statusText}`);
  }

  return await response.json();
}

// Note: booking URL generation not needed here; handled by email function

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
      alert: { ...alert, management_token: alert.management_token },
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
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    // Allow requests with valid CRON_SECRET, service role key, or valid Supabase JWT
    let isAuthorized = false;

    if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
      isAuthorized = true;
      console.log("Authorized via CRON_SECRET");
    } else if (serviceRoleKey && authHeader === `Bearer ${serviceRoleKey}`) {
      isAuthorized = true;
      console.log("Authorized via SUPABASE_SERVICE_ROLE_KEY");
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

          // Find matching dates with time slot availability
          const matchedDates: CalendarDate[] = [];

          for (const date of availableDates) {
            // Skip dates in the past
            const dateObj = new Date(date.date + 'T00:00:00');
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (dateObj < today) {
              continue;
            }

            // Check if date is in alert's date list
            if (!alert.dates.includes(date.date)) {
              continue;
            }

            // Check minimum capacity if specified
            if (alert.min_capacity) {
              const available =
                date.availability.capacity - date.availability.used_capacity;
              if (available < alert.min_capacity) {
                continue;
              }
            }

            // If user has preferred times, check if any sessions match
            if (alert.preferred_times && alert.preferred_times.length > 0) {
              try {
                const sessionsData = await fetchDaySessions(date.date, quantity);
                const availableSessions = sessionsData.event_session._data.filter(
                  (session: EventSession) => !session.sold_out
                );

                // Check if any available session matches user's preferred times
                const hasMatchingTimeSlot = availableSessions.some((session: EventSession) => {
                  const sessionTime = new Date(session.start_datetime);
                  const hours = sessionTime.getHours();
                  const minutes = sessionTime.getMinutes();
                  const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

                  return alert.preferred_times?.includes(timeString);
                });

                if (hasMatchingTimeSlot) {
                  matchedDates.push(date);
                  console.log(`✅ Date ${date.date} has matching time slots for ${alert.email}`);
                }
              } catch (error) {
                console.error(`Error fetching sessions for ${date.date}:`, error);
              }
            } else {
              // No preferred times specified, date availability is enough
              matchedDates.push(date);
            }
          }

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
              preferred_times: alert.preferred_times,
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
