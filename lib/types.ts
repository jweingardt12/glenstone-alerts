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

// Specific time slots that users can select (15-minute increments from 10:00 AM to 4:15 PM)
export type TimeSlot =
  | "10:00" | "10:15" | "10:30" | "10:45"
  | "11:00" | "11:15" | "11:30" | "11:45"
  | "12:00" | "12:15" | "12:30" | "12:45"
  | "13:00" | "13:15" | "13:30" | "13:45"
  | "14:00" | "14:15" | "14:30" | "14:45"
  | "15:00" | "15:15" | "15:30" | "15:45"
  | "16:00" | "16:15";

export interface Alert {
  id: string;
  email: string;
  dates: string[]; // Array of YYYY-MM-DD dates
  timeOfDay?: TimeOfDay; // Optional - kept for backward compatibility with existing alerts
  preferredTimes?: TimeSlot[]; // Array of preferred time slots (e.g., ["10:00", "14:15"])
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
  preferredTimes?: TimeSlot[];
  quantity: number;
  minCapacity?: number;
}

export type CronStatus = "started" | "completed" | "failed";

export interface CronLog {
  id: string;
  status: CronStatus;
  started_at: string;
  completed_at: string | null;
  duration_ms: number | null;
  alerts_checked: number | null;
  notifications_sent: number | null;
  metadata: Record<string, unknown> | null;
  error_message: string | null;
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

export interface HourlyWeather {
  hour: string; // ISO 8601 timestamp
  temperature: number; // Fahrenheit
  conditionCode: string;
  precipitationChance: number; // 0-1
}

export interface HourlyWeatherResponse {
  [hour: string]: HourlyWeather; // Keyed by hour (e.g., "10", "11", "12")
}

export interface CurrentWeather {
  temperature: number;
  feelsLike: number;
  conditionCode: string;
  humidity: number;
  windSpeed: number;
  observationTime: string;
}

// Email verification types
export interface EmailVerification {
  id: string;
  email: string;
  code: string;
  verified: boolean;
  createdAt: string;
  expiresAt: string;
  attempts: number;
}

export interface VerificationRateLimit {
  id: string;
  ipAddress: string;
  email: string;
  createdAt: string;
}
