import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { fetchCalendarAvailability } from "@/lib/glenstone-api";
import { sendAvailabilityAlert } from "@/lib/notifications";

/**
 * Cron job endpoint to check alerts and send notifications
 *
 * Usage:
 * 1. For local testing: Call GET /api/cron/check-alerts
 * 2. For Vercel Cron: Add to vercel.json (see vercel.json file)
 * 3. For external cron: Use a service like cron-job.org to hit this endpoint every 15 minutes
 *
 * Security: In production, add authentication header check
 */

export async function GET(request: NextRequest) {
  let logId: string | null = null;

  try {
    const startTime = Date.now();

    // Optional: Verify cron secret for security
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Start cron log
    logId = await db.cronLogs.start();
    console.log("🔄 Starting alert check...");

    // Get all active alerts
    const alerts = await db.alerts.getAllActive();
    console.log(`📋 Found ${alerts.length} active alerts`);

    if (alerts.length === 0) {
      return NextResponse.json({
        message: "No active alerts to check",
        checked: 0,
        notified: 0,
        duration: Date.now() - startTime,
      });
    }

    let notificationsSent = 0;
    const results: Array<{
      alertId: string;
      email: string;
      matched: number;
      notified: boolean;
    }> = [];

    // Group alerts by quantity to minimize API calls
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
          (date) => date.status === "available"
        );

        // Check each alert in this quantity group
        for (const alert of quantityAlerts) {
          await db.alerts.updateLastChecked(alert.id);

          // Check if 24 hours have passed since last notification
          const now = Date.now();
          const lastNotified = alert.lastNotifiedAt
            ? new Date(alert.lastNotifiedAt).getTime()
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
          const matchedDates = availableDates.filter((date) => {
            // Check if date is in alert's date list
            if (!alert.dates.includes(date.date)) {
              return false;
            }

            // Check minimum capacity if specified
            if (alert.minCapacity) {
              const available =
                date.availability.capacity - date.availability.used_capacity;
              if (available < alert.minCapacity) {
                return false;
              }
            }

            return true;
          });

          if (matchedDates.length > 0) {
            console.log(
              `✅ Found ${matchedDates.length} matching dates for ${alert.email}`
            );

            // Send notification
            const sent = await sendAvailabilityAlert(alert, matchedDates);

            if (sent) {
              notificationsSent++;
              // Update last notified time (alerts remain active for daily reminders)
              await db.alerts.updateLastNotified(alert.id);
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

      // Add small delay between API calls to be respectful
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    const duration = Date.now() - startTime;
    console.log(`✅ Alert check completed in ${duration}ms`);
    console.log(`📧 Sent ${notificationsSent} notifications`);

    // Complete cron log
    if (logId) {
      await db.cronLogs.complete(logId, alerts.length, notificationsSent, {
        results,
        duration,
      });
    }

    return NextResponse.json({
      message: "Alert check completed",
      checked: alerts.length,
      notified: notificationsSent,
      results,
      duration,
    });
  } catch (error) {
    console.error("Error in cron job:", error);

    // Fail cron log
    if (logId) {
      await db.cronLogs.fail(
        logId,
        error instanceof Error ? error.message : "Unknown error"
      );
    }

    return NextResponse.json(
      { error: "Failed to check alerts" },
      { status: 500 }
    );
  }
}

// Allow POST as well for manual triggers
export async function POST(request: NextRequest) {
  return GET(request);
}

export const dynamic = "force-dynamic";
export const maxDuration = 60; // Allow up to 60 seconds for execution
