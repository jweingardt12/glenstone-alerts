import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * Cron status endpoint to check system health
 *
 * Returns:
 * - Total alerts in system
 * - Active alerts count
 * - Last checked timestamps
 * - System health indicators
 */

export async function GET() {
  try {
    // Get all alerts
    const allAlerts = await db.alerts.getAll();
    const activeAlerts = allAlerts.filter(alert => alert.active);

    // Calculate alert statistics
    const totalAlerts = allAlerts.length;
    const activeCount = activeAlerts.length;
    const inactiveCount = totalAlerts - activeCount;

    // Get recent cron logs
    const recentLogs = await db.cronLogs.getRecent(10);
    const lastLog = recentLogs[0];

    // Calculate cron health
    const lastExecutionTime = lastLog?.started_at ? new Date(lastLog.started_at) : null;
    const timeSinceLastExecution = lastExecutionTime
      ? Date.now() - lastExecutionTime.getTime()
      : null;

    const isHealthy = timeSinceLastExecution !== null && timeSinceLastExecution < 20 * 60 * 1000; // Within 20 minutes
    const status = isHealthy ? "healthy" : (timeSinceLastExecution === null ? "unknown" : "stale");

    // Calculate success rate
    const completedLogs = recentLogs.filter(log => log.status === "completed");
    const failedLogs = recentLogs.filter(log => log.status === "failed");
    const successRate = recentLogs.length > 0
      ? Math.round((completedLogs.length / recentLogs.length) * 100)
      : null;

    // Calculate total notifications
    const totalNotificationsSent = completedLogs.reduce(
      (sum, log) => sum + (log.notifications_sent || 0),
      0
    );

    // Alert age statistics
    const now = new Date();
    const recentAlerts = allAlerts.filter(alert => {
      const created = new Date(alert.createdAt);
      const daysDiff = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
      return daysDiff <= 7;
    }).length;

    return NextResponse.json({
      status,
      healthy: isHealthy,
      timestamp: new Date().toISOString(),
      alerts: {
        total: totalAlerts,
        active: activeCount,
        inactive: inactiveCount,
        createdThisWeek: recentAlerts,
      },
      cronExecutions: {
        lastExecution: lastExecutionTime?.toISOString() || null,
        timeSinceLastExecution: timeSinceLastExecution ? Math.floor(timeSinceLastExecution / 1000 / 60) : null, // minutes
        expectedInterval: 15, // minutes
        recentExecutions: recentLogs.length,
        successRate: successRate,
        totalNotificationsSent,
        lastStatus: lastLog?.status || "unknown",
        lastDuration: lastLog?.duration_ms || null,
      },
      recommendations: {
        ...(!isHealthy && timeSinceLastExecution !== null && {
          warning: "Last execution was more than 20 minutes ago. Cron job may not be running.",
          action: "Verify Vercel Cron is enabled or set up external cron service.",
        }),
        ...(timeSinceLastExecution === null && {
          info: "No executions recorded yet. This is normal for new deployments.",
          action: "Wait 15 minutes or manually trigger: curl /api/cron/check-alerts",
        }),
        ...(failedLogs.length > 0 && {
          warning: `${failedLogs.length} of last ${recentLogs.length} executions failed.`,
          action: "Check logs for error details: /api/cron/logs",
        }),
      },
    });
  } catch (error) {
    console.error("Error getting cron status:", error);
    return NextResponse.json(
      {
        status: "error",
        error: "Failed to get cron status",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
