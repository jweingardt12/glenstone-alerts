import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/alerts/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const alert = await db.alerts.get(id);

    if (!alert) {
      return NextResponse.json({ error: "Alert not found" }, { status: 404 });
    }

    return NextResponse.json({ alert });
  } catch (error) {
    console.error("Error fetching alert:", error);
    return NextResponse.json(
      { error: "Failed to fetch alert" },
      { status: 500 }
    );
  }
}

// PATCH /api/alerts/[id] - Update alert (activate/deactivate, dates, times, quantity)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Validate dates if provided
    if (body.dates) {
      if (!Array.isArray(body.dates) || body.dates.length === 0) {
        return NextResponse.json(
          { error: "Dates must be a non-empty array" },
          { status: 400 }
        );
      }

      // Validate date format (YYYY-MM-DD)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      for (const date of body.dates) {
        if (!dateRegex.test(date)) {
          return NextResponse.json(
            { error: "Invalid date format. Use YYYY-MM-DD" },
            { status: 400 }
          );
        }

        // Check if date is in the past
        const dateObj = new Date(date + 'T00:00:00');
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (dateObj < today) {
          return NextResponse.json(
            { error: "Cannot set alert for past dates" },
            { status: 400 }
          );
        }
      }
    }

    // Validate quantity if provided
    if (body.quantity !== undefined) {
      if (typeof body.quantity !== 'number' || body.quantity < 1 || body.quantity > 10) {
        return NextResponse.json(
          { error: "Quantity must be between 1 and 10" },
          { status: 400 }
        );
      }
    }

    // Validate preferredTimes if provided
    if (body.preferredTimes !== undefined && body.preferredTimes !== null) {
      if (!Array.isArray(body.preferredTimes)) {
        return NextResponse.json(
          { error: "preferredTimes must be an array or null" },
          { status: 400 }
        );
      }

      const validTimes = [
        "10:00", "10:15", "10:30", "10:45",
        "11:00", "11:15", "11:30", "11:45",
        "12:00", "12:15", "12:30", "12:45",
        "13:00", "13:15", "13:30", "13:45",
        "14:00", "14:15", "14:30", "14:45",
        "15:00", "15:15", "15:30", "15:45",
        "16:00", "16:15"
      ];

      for (const time of body.preferredTimes) {
        if (!validTimes.includes(time)) {
          return NextResponse.json(
            { error: `Invalid time slot: ${time}` },
            { status: 400 }
          );
        }
      }
    }

    const alert = await db.alerts.update(id, body);

    if (!alert) {
      return NextResponse.json({ error: "Alert not found" }, { status: 404 });
    }

    return NextResponse.json({ alert });
  } catch (error) {
    console.error("Error updating alert:", error);
    return NextResponse.json(
      { error: "Failed to update alert" },
      { status: 500 }
    );
  }
}

// DELETE /api/alerts/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deleted = await db.alerts.delete(id);

    if (!deleted) {
      return NextResponse.json({ error: "Alert not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting alert:", error);
    return NextResponse.json(
      { error: "Failed to delete alert" },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
