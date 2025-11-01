"use client";

import { useState, useEffect, useMemo } from "react";
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
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [direction, setDirection] = useState<'left' | 'right' | null>(null);

  // Create a map of dates to availability data for quick lookup
  const availabilityMap = useMemo(() => {
    const map = new Map<string, CalendarDate>();
    calendarData.forEach((day) => {
      map.set(day.date, day);
    });
    return map;
  }, [calendarData]);

  // Get all dates in the current month view - memoized to prevent infinite loops
  const { monthStart, monthEnd, daysInMonth, isAtMinMonth } = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start, end });
    const todayStart = startOfMonth(new Date());
    const atMin = start.getTime() <= todayStart.getTime();
    return {
      monthStart: start,
      monthEnd: end,
      daysInMonth: days,
      isAtMinMonth: atMin,
    };
  }, [currentMonth]);

  // Add padding days for calendar grid (start on Sunday)
  const startDay = getDay(monthStart); // 0 = Sunday
  const paddingDays = Array.from({ length: startDay }, () => null);

  // Fetch weather data when month changes
  useEffect(() => {
    const fetchWeather = async () => {
      // Prevent duplicate requests
      if (loadingWeather) return;

      try {
        setLoadingWeather(true);
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
      } finally {
        setLoadingWeather(false);
      }
    };

    fetchWeather();
    // monthStart and monthEnd are derived from currentMonth, so we only need currentMonth
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMonth]);

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
    const todayStart = startOfMonth(new Date());
    if (startOfMonth(prev).getTime() < todayStart.getTime()) return;
    setDirection('left');
    setCurrentMonth(prev);
    setTimeout(() => setDirection(null), 500);
  };

  const handleNextMonth = () => {
    setDirection('right');
    setCurrentMonth(addMonths(currentMonth, 1));
    setTimeout(() => setDirection(null), 500);
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
      <div className={cn(
        "border rounded-lg overflow-hidden bg-card transition-all duration-300",
        direction === 'right' && "animate-slide-in-right",
        direction === 'left' && "animate-slide-in-left"
      )}>
        {/* Weekday Headers */}
        <div className="grid grid-cols-7 bg-muted border-b">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, index) => (
            <div
              key={day}
              className={cn(
                "p-3 text-center text-sm font-medium text-muted-foreground",
                index < 6 && "border-r"
              )}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7">
          {/* Padding days */}
          {paddingDays.map((_, i) => (
            <div
              key={`padding-${i}`}
              className={cn(
                "aspect-square border-b bg-muted/30",
                (i % 7) < 6 && "border-r"
              )}
            />
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

            // Check if date is past: either before today OR today but after 4:15pm
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const checkDate = new Date(day.getFullYear(), day.getMonth(), day.getDate());
            const isPastDate = checkDate < today;
            const isToday = checkDate.getTime() === today.getTime();
            const isPastCutoff = isToday && (now.getHours() > 16 || (now.getHours() === 16 && now.getMinutes() >= 15));
            const isPast = isPastDate || isPastCutoff;

            const hasNoData = !dayData;
            const isFutureWithNoData = !isPast && !isClosed && hasNoData;
            const isLastColumn = dayOfWeek === 6; // Saturday

            return (
              <div
                key={dateStr}
                className={cn(
                  "aspect-square min-h-[80px] md:min-h-[100px] border-b relative group overflow-hidden transition-all duration-200",
                  !isLastColumn && "border-r",
                  isPast && "bg-muted/30",
                  isClosed && "bg-muted/50",
                  isFutureWithNoData && "bg-background hover:bg-muted/30 hover:shadow-md hover:scale-[1.02] hover:z-10 cursor-pointer",
                  isAvailable && !isClosed && "bg-green-50 dark:bg-green-950/20 hover:bg-green-100 dark:hover:bg-green-950/40 hover:shadow-lg hover:scale-[1.02] hover:z-10 cursor-pointer",
                  isSoldOut && !isClosed && "bg-muted/50 hover:bg-muted hover:shadow-md hover:scale-[1.02] hover:z-10 cursor-pointer"
                )}
              >
                <div
                  className="absolute inset-0 p-4 flex flex-col"
                  onClick={() => {
                    if (isAvailable && dayData && !isClosed) {
                      handleDayClick(dateStr, dayData);
                    } else if ((isSoldOut || isFutureWithNoData) && !isClosed) {
                      onCreateAlert(dateStr);
                    }
                  }}
                >
                  {/* Date number */}
                  <div className="text-sm font-medium text-foreground mb-1">
                    {format(day, "d")}
                  </div>

                {/* Show "Not yet available" for future dates with no data */}
                {isFutureWithNoData && (
                  <div className="text-xs text-muted-foreground mt-1">
                    Not yet available
                  </div>
                )}

                {/* Availability status */}
                {dayData && !isPast && !isClosed && (
                  <div className="flex-1 flex flex-col justify-between">
                    {isAvailable && (
                      <div className="space-y-0.5">
                        <div className="text-xs font-medium text-green-700 dark:text-green-400">
                          Available
                        </div>
                        <div className="text-xs text-muted-foreground">
                          ~{dayData.availability.capacity - dayData.availability.used_capacity} slots
                        </div>
                        {weather && (
                          <div className="text-xs mt-1 leading-tight">
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <span className="shrink-0">{getWeatherIcon(weather.conditionCode)}</span>
                              <span className="hidden sm:inline">{`${Math.round(weather.temperatureMax)}°/${Math.round(weather.temperatureMin)}°`}</span>
                            </div>
                            {weather.precipitationChance > 0 && (
                              <div className="text-muted-foreground hidden sm:block">{`${Math.round(weather.precipitationChance * 100)}% rain`}</div>
                            )}
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
                          <div className="text-xs mt-1 leading-tight">
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <span className="shrink-0">{getWeatherIcon(weather.conditionCode)}</span>
                              <span className="hidden sm:inline">{`${Math.round(weather.temperatureMax)}°/${Math.round(weather.temperatureMin)}°`}</span>
                            </div>
                            {weather.precipitationChance > 0 && (
                              <div className="text-muted-foreground hidden sm:block">{`${Math.round(weather.precipitationChance * 100)}% rain`}</div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
                {/* Hover overlay action for sold out days and future dates with no data */}
                {(isSoldOut || isFutureWithNoData) && !isPast && !isClosed && (
                  <div className="absolute inset-x-2 bottom-2 pointer-events-none">
                    <div className="h-6 px-2 w-full flex items-center text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <Bell className="h-3 w-3 mr-1" />
                      Create alert
                    </div>
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
    </div>
  );
}
