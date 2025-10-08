import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * Cron logs endpoint to view execution history
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : 50;

    // Get recent cron logs
    const logs = await db.cronLogs.getRecent(Math.min(limit, 100));

    // Format the response
    const formattedLogs = logs.map(log => ({
      id: log.id,
      startedAt: log.started_at,
      completedAt: log.completed_at,
      duration: log.duration_ms,
      status: log.status,
      alertsChecked: log.alerts_checked,
      notificationsSent: log.notifications_sent,
      error: log.error_message,
      metadata: log.metadata,
    }));

    // Calculate summary statistics
    const completedLogs = logs.filter(log => log.status === "completed");
    const failedLogs = logs.filter(log => log.status === "failed");
    const avgDuration = completedLogs.length > 0
      ? Math.round(completedLogs.reduce((sum, log) => sum + (log.duration_ms || 0), 0) / completedLogs.length)
      : null;

    return NextResponse.json({
      logs: formattedLogs,
      summary: {
        total: logs.length,
        completed: completedLogs.length,
        failed: failedLogs.length,
        successRate: logs.length > 0 ? Math.round((completedLogs.length / logs.length) * 100) : null,
        averageDuration: avgDuration,
        totalAlertsChecked: logs.reduce((sum, log) => sum + (log.alerts_checked || 0), 0),
        totalNotificationsSent: logs.reduce((sum, log) => sum + (log.notifications_sent || 0), 0),
      },
    });
  } catch (error) {
    console.error("Error getting cron logs:", error);
    return NextResponse.json(
      { error: "Failed to get cron logs" },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
