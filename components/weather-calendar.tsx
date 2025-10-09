"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { format, startOfMonth, endOfMonth, addMonths } from "date-fns";
import { DayButton, DayPicker } from "react-day-picker";
import { Calendar, CalendarDayButton } from "@/components/ui/calendar";
import { WeatherIcon } from "@/components/weather-icon";
import type { WeatherResponse } from "@/lib/types";
import { cn } from "@/lib/utils";

type WeatherCalendarProps = React.ComponentProps<typeof DayPicker>;

export function WeatherCalendar(props: WeatherCalendarProps) {
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
  };

  // Custom day button with weather
  const WeatherDayButton = ({
    day,
    ...buttonProps
  }: React.ComponentProps<typeof DayButton>) => {
    const dateStr = format(day.date, "yyyy-MM-dd");
    const weather = weatherData?.[dateStr];

    return (
      <CalendarDayButton day={day} {...buttonProps}>
        <span>{day.date.getDate()}</span>
        {weather && (
          <div className="flex items-center justify-center gap-0.5 opacity-70">
            <WeatherIcon conditionCode={weather.conditionCode} className="h-3 w-3" />
            <span className="text-[10px]">{Math.round(weather.temperatureMax)}°</span>
          </div>
        )}
      </CalendarDayButton>
    );
  };

  return (
    <Calendar
      {...props}
      onMonthChange={handleMonthChange}
      components={{
        DayButton: WeatherDayButton,
      }}
    />
  );
}
