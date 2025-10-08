// Glenstone API Types

export interface AvailabilityData {
  capacity: number;
  used_capacity: number;
}

export interface CalendarDate {
  date: string; // YYYY-MM-DD format
  status: "available" | "sold_out";
  availability: AvailabilityData;
}

export interface CalendarResponse {
  _total: number;
  calendar: {
    _count: number;
    _data: CalendarDate[];
    _total: number;
  };
}

export interface EventSession {
  portal_id: string;
  seller_id: string;
  event_template_id: string;
  id: string;
  start_datetime: string; // ISO 8601 format
  end_datetime: string;
  capacity: number;
  oversell_capacity: number;
  used_capacity: number;
  sold_quantity: number;
  sold_out: boolean;
  oversold_out: boolean;
  redeemed_count: number;
  largest_stage: number;
}

export interface SessionsResponse {
  _limit: [number, number];
  _total: number;
  event_session: {
    _count: number;
    _data: EventSession[];
    _total: number;
  };
  price_schedule?: {
    _count: number;
    _data: unknown[];
    _total: number;
  };
}

export interface TicketTypeRequest {
  ticket_type_id: string;
  quantity: number;
}

export interface CalendarRequest {
  ticket_types_required: TicketTypeRequest[];
}

export interface EventTemplate {
  _rank: number;
  capacity: number;
  category: string;
  dedicated_order: boolean;
  description: string;
  event_type: string;
  hidden_type: string;
  id: string;
  name: string;
  oversell_capacity: number;
  portal_id: string;
  release_sessions_until: string;
  scan_code_type: string;
  seller_id: string;
  stage_size: number;
  subtitle: string;
  summary: string;
  ticket_template_id: string;
  venue_id: string;
}

export interface EventResponse {
  _total: number;
  event_template: {
    _count: number;
    _data: EventTemplate[];
    _total: number;
  };
}

// Alert types
export type TimeOfDay = "morning" | "midday" | "afternoon" | "any";

export interface Alert {
  id: string;
  email: string;
  dates: string[]; // Array of YYYY-MM-DD dates
  timeOfDay: TimeOfDay;
  quantity: number;
  minCapacity?: number; // Minimum available slots needed
  active: boolean;
  createdAt: string;
  lastChecked?: string;
  lastNotifiedAt?: string; // Timestamp of last notification (for 24-hour repeat logic)
  managementToken?: string; // Secure token for managing alerts
}

export interface CreateAlertRequest {
  email: string;
  dates: string[];
  timeOfDay: TimeOfDay;
  quantity: number;
  minCapacity?: number;
}

// Weather types
export interface DailyWeather {
  date: string;
  temperatureMax: number;
  temperatureMin: number;
  conditionCode: string;
  precipitationChance: number;
}

export interface WeatherResponse {
  [date: string]: DailyWeather;
}
