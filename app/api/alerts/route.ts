import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { CreateAlertRequest } from "@/lib/types";

// GET /api/alerts?email=user@example.com
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const email = searchParams.get("email");

    if (email) {
      const alerts = await db.alerts.getByEmail(email);
      return NextResponse.json({ alerts });
    }

    // If no email, return all alerts (admin functionality)
    const alerts = await db.alerts.getAll();
    return NextResponse.json({ alerts });
  } catch (error) {
    console.error("Error fetching alerts:", error);
    return NextResponse.json(
      { error: "Failed to fetch alerts" },
      { status: 500 }
    );
  }
}

// POST /api/alerts - Create new alert
export async function POST(request: NextRequest) {
  try {
    const body: CreateAlertRequest = await request.json();

    // Validation
    if (!body.email || !body.dates || body.dates.length === 0) {
      return NextResponse.json(
        { error: "Email and at least one date are required" },
        { status: 400 }
      );
    }

    if (body.quantity < 1 || body.quantity > 10) {
      return NextResponse.json(
        { error: "Quantity must be between 1 and 10" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Check if user already has alerts
    const existingAlerts = await db.alerts.getByEmail(body.email);

    // Check for duplicate alert (same email + same dates)
    const sortedNewDates = [...body.dates].sort().join(',');
    const sortedNewTimes = body.preferredTimes ? [...body.preferredTimes].sort().join(',') : '';
    const duplicateAlert = existingAlerts.find(alert => {
      const sortedAlertDates = [...alert.dates].sort().join(',');
      const sortedAlertTimes = alert.preferredTimes ? [...alert.preferredTimes].sort().join(',') : '';
      return sortedAlertDates === sortedNewDates &&
             sortedAlertTimes === sortedNewTimes &&
             alert.quantity === body.quantity;
    });

    if (duplicateAlert) {
      // Send management email so user can access their alerts
      const managementToken = await db.alerts.getOrCreateManagementToken(body.email);

      try {
        await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-confirmation-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          },
          body: JSON.stringify({
            type: 'management',
            email: body.email,
            token: managementToken,
            alertsCount: existingAlerts.length
          }),
        });
      } catch (error) {
        console.error("Error sending management email:", error);
      }

      return NextResponse.json(
        {
          error: "You already have an identical alert set up for these dates. We've sent you an email with a link to manage your alerts.",
          existingAlert: true
        },
        { status: 400 }
      );
    }

    // Create alert
    let alert = await db.alerts.create(body);

    // Always assign a management token (get existing or create new)
    const managementToken = await db.alerts.getOrCreateManagementToken(body.email);
    const updatedAlert = await db.alerts.update(alert.id, { managementToken });
    if (updatedAlert) {
      alert = updatedAlert;
    }

    // Send confirmation email via edge function
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-confirmation-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({ type: 'confirmation', alert }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error("Failed to send confirmation email:", error);
      } else {
        console.log("Confirmation email sent successfully");
      }
    } catch (error) {
      console.error("Error sending confirmation email:", error);
      // Don't fail the request if email fails
    }

    return NextResponse.json({ alert }, { status: 201 });
  } catch (error) {
    console.error("Error creating alert:", error);
    return NextResponse.json(
      { error: "Failed to create alert" },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
