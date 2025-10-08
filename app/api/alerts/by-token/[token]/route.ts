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

export const dynamic = "force-dynamic";
