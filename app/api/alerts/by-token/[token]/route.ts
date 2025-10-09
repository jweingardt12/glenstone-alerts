import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isValidTokenFormat } from "@/lib/token";

// GET /api/alerts/by-token/[token]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    // Validate token format
    if (!isValidTokenFormat(token)) {
      return NextResponse.json(
        { error: "Invalid token format" },
        { status: 400 }
      );
    }

    // Fetch alerts by token
    const alerts = await db.alerts.getByToken(token);

    if (!alerts || alerts.length === 0) {
      return NextResponse.json(
        { error: "No alerts found for this token" },
        { status: 404 }
      );
    }

    return NextResponse.json({ alerts });
  } catch (error) {
    console.error("Error fetching alerts by token:", error);
    return NextResponse.json(
      { error: "Failed to fetch alerts" },
      { status: 500 }
    );
  }
}

// PATCH /api/alerts/by-token/[token] - Delete all alerts for this token
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    console.log("Delete all alerts request for token:", token);

    // Validate token format
    if (!isValidTokenFormat(token)) {
      console.log("Invalid token format:", token);
      return NextResponse.json(
        { error: "Invalid token format" },
        { status: 400 }
      );
    }

    // Fetch alerts by token
    const alerts = await db.alerts.getByToken(token);
    console.log("Found alerts:", alerts?.length);

    if (!alerts || alerts.length === 0) {
      console.log("No alerts found for token");
      return NextResponse.json(
        { error: "No alerts found for this token" },
        { status: 404 }
      );
    }

    // Delete all alerts
    console.log("Deleting alerts...");
    const deletedCount = await db.alerts.deleteAllByToken(token);
    console.log("Deleted count:", deletedCount);

    return NextResponse.json({
      success: true,
      deletedCount,
      message: `Successfully deleted ${deletedCount} alert${deletedCount !== 1 ? 's' : ''}`
    });
  } catch (error) {
    console.error("Error deleting alerts by token:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete alerts" },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
