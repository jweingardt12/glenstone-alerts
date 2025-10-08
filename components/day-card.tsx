"use client";

import { format, parseISO } from "date-fns";
import { Bell } from "lucide-react";
import type { CalendarDate, DailyWeather } from "@/lib/types";
import { getWeatherIcon } from "@/lib/weather-utils";

interface DayCardProps {
  dayData: CalendarDate;
  weather?: DailyWeather;
  isSelected: boolean;
  onClick: () => void;
  onCreateAlert: (date: string) => void;
}

export function DayCard({ dayData, weather, isSelected, onClick, onCreateAlert }: DayCardProps) {
  const date = parseISO(dayData.date);
  const available = dayData.availability.capacity - dayData.availability.used_capacity;
  const isSoldOut = dayData.status === "sold_out" || available === 0;

  return (
    <div
      className={`
        w-full border rounded-sm p-5 transition-all min-h-[60px]
        ${isSelected
          ? "border-primary/50 bg-muted"
          : "border bg-card"
        }
        ${isSoldOut ? "opacity-50" : ""}
      `}
    >
      <div className="flex justify-between items-start gap-3">
        <button
          onClick={onClick}
          disabled={isSoldOut}
          className={`flex-1 text-left ${isSoldOut ? "cursor-not-allowed" : "cursor-pointer transition-all duration-200 ease-in-out active:opacity-70 active:scale-[0.99]"}`}
        >
          <div className="text-base font-light">
            {format(date, "EEEE, MMMM d")}
          </div>
          <div className={`text-sm mt-1 ${isSoldOut ? "text-muted-foreground" : "text-muted-foreground"}`}>
            {isSoldOut ? "Sold out" : `${available} ${available === 1 ? "pass" : "passes"} available`}
          </div>
          {weather && (
            <div className="text-sm mt-1 text-muted-foreground flex items-center gap-2">
              <span>{getWeatherIcon(weather.conditionCode)}</span>
              <span>
                {Math.round(weather.temperatureMax)}°/{Math.round(weather.temperatureMin)}°
              </span>
              {weather.precipitationChance > 0 && (
                <span>• {Math.round(weather.precipitationChance * 100)}% rain</span>
              )}
            </div>
          )}
        </button>

        <div className="flex items-center gap-2">
          {/* Status badge */}
          {!isSoldOut && available <= 20 && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-light border bg-muted">
              Limited
            </span>
          )}
          {!isSoldOut && available > 20 && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-light border bg-card">
              Available
            </span>
          )}
          {isSoldOut && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-light border text-muted-foreground bg-muted">
              Sold Out
            </span>
          )}

          {/* Alert button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCreateAlert(dayData.date);
            }}
            className="p-2 hover:bg-muted rounded-sm transition-all duration-200 ease-in-out active:scale-95"
            aria-label="Create alert for this date"
            title="Create alert for this date"
          >
            <Bell className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
