"use client";

import { useState, useEffect } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths } from "date-fns";
import { Button } from "./ui/button";
import { ChevronLeft, ChevronRight, Bell } from "lucide-react";
import type { CalendarDate, EventSession, WeatherResponse } from "@/lib/types";
import { cn } from "@/lib/utils";
import { getWeatherIcon } from "@/lib/weather-utils";

interface AvailabilityCalendarProps {
  calendarData: CalendarDate[];
  quantity: number;
  onDaySelect: (date: string, sessions: EventSession[]) => void;
  onCreateAlert: (date: string) => void;
}

export function AvailabilityCalendar({
  calendarData,
  quantity,
  onDaySelect,
  onCreateAlert,
}: AvailabilityCalendarProps) {
  const [loading, setLoading] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [weatherData, setWeatherData] = useState<WeatherResponse>({});

  // Create a map of dates to availability data for quick lookup
  const availabilityMap = new Map<string, CalendarDate>();
  calendarData.forEach((day) => {
    availabilityMap.set(day.date, day);
  });

  // Get all dates in the current month view
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const todayStart = startOfMonth(new Date());
  const isAtMinMonth = monthStart.getTime() <= todayStart.getTime();

  // Add padding days for calendar grid (start on Sunday)
  const startDay = getDay(monthStart); // 0 = Sunday
  const paddingDays = Array.from({ length: startDay }, () => null);

  // Fetch weather data when month changes
  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const startDate = format(monthStart, "yyyy-MM-dd");
        const endDate = format(monthEnd, "yyyy-MM-dd");

        const response = await fetch(
          `/api/weather?startDate=${startDate}&endDate=${endDate}`
        );

        if (response.ok) {
          const data = await response.json();
          setWeatherData(data);
        }
      } catch (error) {
        console.error("Error fetching weather:", error);
      }
    };

    fetchWeather();
  }, [currentMonth, monthStart, monthEnd]);

  const handleDayClick = async (dateStr: string, dayData: CalendarDate) => {
    if (dayData.status === "sold_out") return;

    try {
      setLoading(true);

      const response = await fetch(
        `/api/sessions?date=${dateStr}&quantity=${quantity}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch sessions");
      }

      const data = await response.json();
      onDaySelect(dateStr, data.event_session._data);
    } catch (error) {
      console.error("Error loading sessions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePreviousMonth = () => {
    const prev = subMonths(currentMonth, 1);
    if (startOfMonth(prev).getTime() < todayStart.getTime()) return;
    setCurrentMonth(prev);
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  return (
    <div className="space-y-6">
      {/* Month Navigation */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-light">
          {format(currentMonth, "MMMM yyyy")}
        </h3>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePreviousMonth}
            disabled={isAtMinMonth}
            className="h-8 w-8"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleNextMonth}
            className="h-8 w-8"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="border rounded-lg overflow-hidden bg-card">
        {/* Weekday Headers */}
        <div className="grid grid-cols-7 bg-muted">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div
              key={day}
              className="p-3 text-center text-sm font-medium text-muted-foreground"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7">
          {/* Padding days */}
          {paddingDays.map((_, i) => (
            <div key={`padding-${i}`} className="aspect-square border-t border-r bg-muted/30" />
          ))}

          {/* Actual days */}
          {daysInMonth.map((day) => {
            const dateStr = format(day, "yyyy-MM-dd");
            const dayData = availabilityMap.get(dateStr);
            const weather = weatherData[dateStr];
            const dayOfWeek = getDay(day); // 0 = Sunday, 1 = Monday, etc.
            const isClosed = dayOfWeek >= 1 && dayOfWeek <= 3; // Monday, Tuesday, Wednesday
            const isAvailable = dayData?.status === "available";
            const isSoldOut = dayData?.status === "sold_out";
            const isPast = day < new Date(new Date().setHours(0, 0, 0, 0));

            return (
              <div
                key={dateStr}
                className={cn(
                  "aspect-square border-t border-r relative group overflow-hidden",
                  isPast && "bg-muted/30",
                  isClosed && "bg-muted/50",
                  !isPast && !isClosed && !dayData && "bg-background",
                  isAvailable && !isClosed && "bg-green-50 dark:bg-green-950/20 hover:bg-green-100 dark:hover:bg-green-950/40 cursor-pointer transition-colors",
                  isSoldOut && !isClosed && "bg-muted/50"
                )}
              >
                <div
                  className="absolute inset-0 p-2 flex flex-col"
                  onClick={() => {
                    if (isAvailable && dayData && !isClosed) {
                      handleDayClick(dateStr, dayData);
                    }
                  }}
                >
                  {/* Date number */}
                  <div className="text-sm font-medium text-foreground mb-1">
                    {format(day, "d")}
                  </div>

                {/* Availability status */}
                {dayData && !isPast && !isClosed && (
                  <div className="flex-1 flex flex-col justify-between">
                    {isAvailable && (
                      <div className="space-y-0.5">
                        <div className="text-xs font-medium text-green-700 dark:text-green-400">
                          Available
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {dayData.availability.capacity - dayData.availability.used_capacity} slots
                        </div>
                        {weather && (
                          <div className="text-xs mt-1 leading-tight h-[18px]">
                            <div className="flex items-center gap-1 text-muted-foreground min-w-0 w-full">
                              <span className="shrink-0">{getWeatherIcon(weather.conditionCode)}</span>
                              <span className="truncate">
                                {`${Math.round(weather.temperatureMax)}°/${Math.round(weather.temperatureMin)}°`}
                                {weather.precipitationChance > 0
                                  ? ` • ${Math.round(weather.precipitationChance * 100)}% rain`
                                  : ""}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    {isSoldOut && (
                      <div className="space-y-1">
                        <div className="text-xs font-medium text-muted-foreground">
                          Sold Out
                        </div>
                        {weather && (
                          <div className="text-xs mt-1 leading-tight h-[18px]">
                            <div className="flex items-center gap-1 text-muted-foreground min-w-0 w-full">
                              <span className="shrink-0">{getWeatherIcon(weather.conditionCode)}</span>
                              <span className="truncate">
                                {`${Math.round(weather.temperatureMax)}°/${Math.round(weather.temperatureMin)}°`}
                                {weather.precipitationChance > 0
                                  ? ` • ${Math.round(weather.precipitationChance * 100)}% rain`
                                  : ""}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
                {/* Hover overlay action for sold out days */}
                {isSoldOut && (
                  <div className="absolute inset-x-2 bottom-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 w-full justify-start text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 ease-in-out pointer-events-none group-hover:pointer-events-auto"
                      onClick={(e) => {
                        e.stopPropagation();
                        onCreateAlert(dateStr);
                      }}
                    >
                      <Bell className="h-3 w-3 mr-1" />
                      Alert
                    </Button>
                  </div>
                )}
              </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Loading indicator */}
      {loading && (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
        </div>
      )}

      {/* Legend */}
      <div className="flex gap-6 text-sm text-muted-foreground justify-center">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-100 dark:bg-green-950/40 border border-green-200 dark:border-green-900 rounded" />
          <span>Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-muted/50 border rounded" />
          <span>Sold Out</span>
        </div>
      </div>
    </div>
  );
}
