import { NextRequest, NextResponse } from "next/server";
import { fetchCalendarAvailability } from "@/lib/glenstone-api";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const quantity = parseInt(searchParams.get("quantity") || "2");

    if (quantity < 1 || quantity > 10) {
      return NextResponse.json(
        { error: "Quantity must be between 1 and 10" },
        { status: 400 }
      );
    }

    const calendarData = await fetchCalendarAvailability(quantity);

    return NextResponse.json(calendarData);
  } catch (error) {
    console.error("Error fetching availability:", error);
    return NextResponse.json(
      { error: "Failed to fetch availability data" },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
export const revalidate = 0;
