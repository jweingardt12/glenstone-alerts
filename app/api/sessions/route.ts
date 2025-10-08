import { NextRequest, NextResponse } from "next/server";
import { fetchDaySessions } from "@/lib/glenstone-api";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get("date");
    const quantity = parseInt(searchParams.get("quantity") || "2");

    if (!date) {
      return NextResponse.json(
        { error: "Date parameter is required (format: YYYY-MM-DD)" },
        { status: 400 }
      );
    }

    if (quantity < 1 || quantity > 10) {
      return NextResponse.json(
        { error: "Quantity must be between 1 and 10" },
        { status: 400 }
      );
    }

    const sessionsData = await fetchDaySessions(date, quantity);

    return NextResponse.json(sessionsData);
  } catch (error) {
    console.error("Error fetching sessions:", error);
    return NextResponse.json(
      { error: "Failed to fetch session data" },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
export const revalidate = 0;
