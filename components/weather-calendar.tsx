"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { format, startOfMonth, endOfMonth, addMonths } from "date-fns";
import { DayButton, DayPicker } from "react-day-picker";
import { Calendar, CalendarDayButton } from "@/components/ui/calendar";
import { WeatherIcon } from "@/components/weather-icon";
import { cn } from "@/lib/utils";
import type { WeatherResponse } from "@/lib/types";

type WeatherCalendarProps = React.ComponentProps<typeof DayPicker>;

export function WeatherCalendar({
  className,
  onMonthChange,
  ...props
}: WeatherCalendarProps) {
  const [weatherData, setWeatherData] = useState<WeatherResponse | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Fetch weather for the current month
  useEffect(() => {
    const fetchWeather = async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const monthStart = startOfMonth(currentMonth);

      // Only fetch from today onwards, not past dates
      const start = monthStart < today ? today : monthStart;
      const end = endOfMonth(addMonths(currentMonth, 1)); // Fetch next month too for navigation

      const startDate = format(start, "yyyy-MM-dd");
      const endDate = format(end, "yyyy-MM-dd");

      try {
        const response = await fetch(`/api/weather?startDate=${startDate}&endDate=${endDate}`);
        if (response.ok) {
          const data = await response.json();
          setWeatherData(data);
        }
      } catch (error) {
        console.error("Failed to fetch weather:", error);
      }
    };

    void fetchWeather();
  }, [currentMonth]);

  // Track month changes
  const handleMonthChange = (date: Date) => {
    setCurrentMonth(date);
    onMonthChange?.(date);
  };

  // Custom day button with weather
  const WeatherDayButton = ({
    day,
    ...buttonProps
  }: React.ComponentProps<typeof DayButton>) => {
    const dateStr = format(day.date, "yyyy-MM-dd");
    const weather = weatherData?.[dateStr];

    return (
      <CalendarDayButton
        day={day}
        {...buttonProps}
        className="relative flex-col items-center justify-center gap-0.5 px-1 pb-4 pt-2 sm:pb-2 sm:pt-1 sm:gap-1"
      >
        <span className="text-xs font-medium sm:text-sm">
          {day.date.getDate()}
        </span>
        {weather && (
          <div className="pointer-events-none absolute bottom-1 left-1/2 flex -translate-x-1/2 items-center justify-center gap-0.5 text-[0.625rem] text-muted-foreground sm:static sm:translate-x-0 sm:text-[0.7rem]">
            <WeatherIcon
              conditionCode={weather.conditionCode}
              className="h-3 w-3 sm:h-3.5 sm:w-3.5"
            />
            <span>{Math.round(weather.temperatureMax)}°</span>
          </div>
        )}
      </CalendarDayButton>
    );
  };

  return (
    <Calendar
      className={cn(
        "[--cell-size:clamp(2.6rem,12vw,3.25rem)] sm:[--cell-size:2.6rem] md:[--cell-size:2.75rem]",
        className
      )}
      onMonthChange={handleMonthChange}
      components={{
        DayButton: WeatherDayButton,
      }}
      {...props}
    />
  );
}
