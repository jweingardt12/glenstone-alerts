import type {
  CalendarResponse,
  CalendarRequest,
  EventResponse,
  CalendarDate,
  SessionsResponse,
} from "./types";

// Glenstone API constants
export const GLENSTONE_CONFIG = {
  BASE_URL: "https://visit.glenstone.org",
  EVENT_ID: "8c42a85b-0f1b-eee0-a921-8464481a74f6",
  TICKET_TYPE_ID: "66b9a9ca-39a1-7a8f-956d-0861a4e17c98",
  BOOKING_URL: "https://visit.glenstone.org/events/8c42a85b-0f1b-eee0-a921-8464481a74f6",
} as const;

/**
 * Fetch calendar availability from Glenstone API
 * @param quantity - Number of tickets requested (default: 2)
 * @returns Calendar data with availability for ~31 days
 */
export async function fetchCalendarAvailability(
  quantity: number = 2
): Promise<CalendarResponse> {
  const url = `${GLENSTONE_CONFIG.BASE_URL}/api/events/${GLENSTONE_CONFIG.EVENT_ID}/calendar?_format=extended`;

  const requestBody: CalendarRequest = {
    ticket_types_required: [
      {
        ticket_type_id: GLENSTONE_CONFIG.TICKET_TYPE_ID,
        quantity,
      },
    ],
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      accept: "application/json, text/plain, */*",
      "content-type": "application/json",
      "tix-app": "ecomm",
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch calendar: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetch event details from Glenstone API
 * @returns Event template data
 */
export async function fetchEventDetails(): Promise<EventResponse> {
  const url = `${GLENSTONE_CONFIG.BASE_URL}/api/events/${GLENSTONE_CONFIG.EVENT_ID}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "tix-app": "ecomm",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch event details: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Generate a booking URL for a specific date
 * @param date - Date in YYYY-MM-DD format
 * @param quantity - Number of tickets
 * @returns Direct booking URL
 */
export function generateBookingUrl(date: string, quantity: number = 2): string {
  // Glenstone deep link format requires only `date` and `quantity`.
  return `${GLENSTONE_CONFIG.BOOKING_URL}?date=${date}&quantity=${quantity ?? 2}`;
}

/**
 * Filter calendar dates by status
 */
export function filterAvailableDates(
  calendarData: CalendarDate[]
): CalendarDate[] {
  return calendarData.filter((date) => date.status === "available");
}

/**
 * Filter calendar dates by minimum capacity
 */
export function filterByMinCapacity(
  calendarData: CalendarDate[],
  minCapacity: number
): CalendarDate[] {
  return calendarData.filter(
    (date) =>
      date.status === "available" &&
      date.availability.capacity - date.availability.used_capacity >= minCapacity
  );
}

/**
 * Calculate availability percentage
 */
export function calculateAvailabilityPercentage(date: CalendarDate): number {
  const { capacity, used_capacity } = date.availability;
  if (capacity === 0) return 0;
  return Math.round(((capacity - used_capacity) / capacity) * 100);
}

/**
 * Get availability status with color coding
 */
export function getAvailabilityStatus(date: CalendarDate): {
  status: "available" | "low" | "sold-out";
  color: string;
  percentage: number;
} {
  if (date.status === "sold_out") {
    return { status: "sold-out", color: "red", percentage: 0 };
  }

  const percentage = calculateAvailabilityPercentage(date);

  if (percentage > 30) {
    return { status: "available", color: "green", percentage };
  } else if (percentage > 0) {
    return { status: "low", color: "yellow", percentage };
  } else {
    return { status: "sold-out", color: "red", percentage: 0 };
  }
}

/**
 * Fetch time slots (sessions) for a specific date
 * @param date - Date in YYYY-MM-DD format
 * @param quantity - Number of tickets requested
 * @returns Sessions data with time slots and availability
 */
export async function fetchDaySessions(
  date: string,
  quantity: number = 2
): Promise<SessionsResponse> {
  const url = `${GLENSTONE_CONFIG.BASE_URL}/api/events/${GLENSTONE_CONFIG.EVENT_ID}/sessions?_include_sold_out=true&_ondate=${date}&_sort=start_datetime`;

  const requestBody: CalendarRequest = {
    ticket_types_required: [
      {
        ticket_type_id: GLENSTONE_CONFIG.TICKET_TYPE_ID,
        quantity,
      },
    ],
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      accept: "application/json, text/plain, */*",
      "content-type": "application/json",
      "tix-app": "ecomm",
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch sessions: ${response.statusText}`);
  }

  return response.json();
}
