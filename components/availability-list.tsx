"use client";

import { useState, useMemo, useEffect } from "react";
import { DayCard } from "./day-card";
import { Button } from "./ui/button";
import type { CalendarDate, EventSession, WeatherResponse } from "@/lib/types";
// import { format } from "date-fns";

interface AvailabilityListProps {
  calendarData: CalendarDate[];
  quantity: number;
  onDaySelect: (date: string, sessions: EventSession[]) => void;
  onCreateAlert: (date: string) => void;
}

export function AvailabilityList({
  calendarData,
  quantity,
  onDaySelect,
  onCreateAlert,
}: AvailabilityListProps) {
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [visibleCount, setVisibleCount] = useState(14);
  const [weatherData, setWeatherData] = useState<WeatherResponse>({});

  // Get visible days based on pagination
  const visibleDays = useMemo(() => {
    return calendarData.slice(0, visibleCount);
  }, [calendarData, visibleCount]);

  const hasMore = calendarData.length > visibleCount;

  // Fetch weather data for visible dates
  useEffect(() => {
    const fetchWeather = async () => {
      if (calendarData.length === 0) return;

      try {
        const startDate = calendarData[0].date;
        const endDate = calendarData[calendarData.length - 1].date;

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
  }, [calendarData]);

  const handleDayClick = async (dayData: CalendarDate) => {
    // Don't load if sold out
    if (dayData.status === "sold_out") return;

    try {
      setLoading(true);
      setSelectedDay(dayData.date);

      const response = await fetch(
        `/api/sessions?date=${dayData.date}&quantity=${quantity}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch sessions");
      }

      const data = await response.json();
      onDaySelect(dayData.date, data.event_session._data);
    } catch (error) {
      console.error("Error loading sessions:", error);
    } finally {
      setLoading(false);
    }
  };

  if (visibleDays.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground font-light">
        No availability data
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {visibleDays.map((dayData) => (
        <DayCard
          key={dayData.date}
          dayData={dayData}
          weather={weatherData[dayData.date]}
          isSelected={selectedDay === dayData.date}
          onClick={() => handleDayClick(dayData)}
          onCreateAlert={onCreateAlert}
        />
      ))}

      {loading && (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
        </div>
      )}

      {hasMore && !loading && (
        <Button
          onClick={() => setVisibleCount((prev) => prev + 14)}
          variant="outline"
          className="w-full mt-4 border-stone-300 text-stone-700 hover:bg-stone-50"
        >
          Show Next 14 Days ({calendarData.length - visibleCount} remaining)
        </Button>
      )}
    </div>
  );
}
