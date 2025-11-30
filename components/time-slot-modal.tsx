"use client";

import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { format, parseISO, getHours } from "date-fns";
import { ExternalLink, Bell } from "lucide-react";
import type { EventSession, HourlyWeatherResponse } from "@/lib/types";
import { AlertForm } from "@/components/alert-form";
import { WeatherIcon } from "@/components/weather-icon";

interface TimeSlotModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: string | null;
  sessions: EventSession[];
  onBook: () => void;
}

export function TimeSlotModal({
  isOpen,
  onClose,
  date,
  sessions,
  onBook,
}: TimeSlotModalProps) {
  const [showAlertForm, setShowAlertForm] = useState(false);
  const [weatherData, setWeatherData] = useState<HourlyWeatherResponse | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);

  // Fetch weather data when modal opens
  useEffect(() => {
    if (isOpen && date) {
      setWeatherLoading(true);
      fetch(`/api/weather/hourly?date=${date}`)
        .then((res) => res.json())
        .then((data) => {
          setWeatherData(data);
        })
        .catch((err) => {
          console.error("Failed to fetch weather:", err);
          setWeatherData(null);
        })
        .finally(() => {
          setWeatherLoading(false);
        });
    }
  }, [isOpen, date]);

  if (!date) return null;

  // Only show sessions up to and including 4:15 PM
  const isBeforeCutoff = (iso: string) => {
    try {
      const d = parseISO(iso);
      if (isNaN(d.getTime())) return false;
      const h = d.getHours();
      const m = d.getMinutes();
      return h < 16 || (h === 16 && m <= 15);
    } catch {
      return false;
    }
  };

  const visibleSessions = sessions.filter((s) => isBeforeCutoff(s.start_datetime));
  const availableSessions = visibleSessions.filter((s) => !s.sold_out);
  const unavailableSessions = visibleSessions.filter((s) => s.sold_out);

  // Parse date with timezone-safe approach (YYYY-MM-DD format)
  const dateParts = date.split('-').map(Number);
  const dateObj = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);

  const handleOpenAlert = () => {
    onClose(); // Close the time slot modal
    setShowAlertForm(true); // Open the alert form
  };

  const renderSession = (session: EventSession) => {
    const available = session.capacity - session.used_capacity;
    const startTime = parseISO(session.start_datetime);
    const hour = getHours(startTime).toString();
    const weather = weatherData?.[hour];

    return (
      <div
        key={session.id}
        className={`flex justify-between items-center p-3 rounded-sm border ${
          session.sold_out
            ? "bg-muted"
            : "bg-card"
        }`}
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-light">
            {format(startTime, "h:mm a")}
          </span>
          {weather && !weatherLoading && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <WeatherIcon conditionCode={weather.conditionCode} className="h-3.5 w-3.5" />
              <span className="text-xs">{weather.temperature}°</span>
              {weather.precipitationChance > 0 && (
                <span className="text-xs">
                  {Math.round(weather.precipitationChance * 100)}%
                </span>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`text-sm ${
              session.sold_out ? "text-muted-foreground" : "text-muted-foreground"
            }`}
          >
            {session.sold_out ? "Sold out" : `${available} passes`}
          </span>
          {session.sold_out && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2"
              onClick={handleOpenAlert}
            >
              <Bell className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent side="right" className="p-0 gap-0 w-full sm:max-w-md flex flex-col">
          {/* Header */}
          <SheetHeader className="p-6 pb-4 border-b">
              <SheetTitle className="text-2xl font-light">
                {format(dateObj, "MMMM d, yyyy")}
              </SheetTitle>
              <SheetDescription className="text-sm font-light">
                {format(dateObj, "EEEE")} • {availableSessions.length} of {visibleSessions.length} slots available
              </SheetDescription>
            </SheetHeader>

            {/* Scrollable time slots */}
            <div className="overflow-y-auto p-6 space-y-4 flex-1">
          {sessions.length > 0 ? (
            <>
              {/* Available sessions */}
              {availableSessions.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Available
                  </h3>
                  {availableSessions.map(renderSession)}
                </div>
              )}

              {/* Unavailable sessions */}
              {unavailableSessions.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Sold Out
                  </h3>
                  {unavailableSessions.map(renderSession)}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground font-light text-sm">
                No time slots available
              </p>
            </div>
          )}
            </div>

          {/* Bottom action */}
          {sessions.some((s) => !s.sold_out) && (
            <div className="p-6 pt-4 border-t">
              <Button
                onClick={onBook}
                className="w-full"
              >
                Book on Glenstone.org
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Alert Form - Same component used everywhere */}
      <AlertForm
        isOpen={showAlertForm}
        onClose={() => setShowAlertForm(false)}
        prefilledDate={date}
      />
    </>
  );
}
