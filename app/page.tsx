"use client";

import { useState, useEffect } from "react";
import { AlertForm } from "@/components/alert-form";
import { AvailabilityList } from "@/components/availability-list";
import { AvailabilityCalendar } from "@/components/availability-calendar";
import { TimeSlotModal } from "@/components/time-slot-modal";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { format, parseISO } from "date-fns";
import { ExternalLink, RotateCw } from "lucide-react";
import type { CalendarDate, CalendarResponse, EventSession } from "@/lib/types";
import { generateBookingUrl } from "@/lib/glenstone-api";

export default function Home() {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [sessions, setSessions] = useState<EventSession[]>([]);
  const [calendarData, setCalendarData] = useState<CalendarDate[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(2);

  // Modal states
  const [showTimeSlotModal, setShowTimeSlotModal] = useState(false);
  const [showAlertForm, setShowAlertForm] = useState(false);
  const [prefilledDate, setPrefilledDate] = useState<string | null>(null);

  const fetchAvailability = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/availability?quantity=${quantity}`);
      if (!response.ok) throw new Error("Failed to fetch availability");
      const data: CalendarResponse = await response.json();
      setCalendarData(data.calendar._data);
    } catch (err) {
      console.error("Error fetching availability:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAvailability();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quantity]);

  const handleDaySelect = (date: string, daySessions: EventSession[]) => {
    setSelectedDate(date);
    setSessions(daySessions);
    setShowTimeSlotModal(true);
  };

  const handleCreateAlert = (date: string) => {
    // Reset first to ensure useEffect triggers even if same date
    setPrefilledDate(null);
    // Use setTimeout to ensure state updates in correct order
    setTimeout(() => {
      setPrefilledDate(date);
      setShowAlertForm(true);
    }, 0);
  };

  const handleBooking = () => {
    if (selectedDate) {
      window.open(generateBookingUrl(selectedDate, quantity), "_blank");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Minimal Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h1 className="text-3xl sm:text-4xl font-light tracking-wide">
                Glenstone Tickets
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground font-light">
                Free admission • Advance reservation required
              </p>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="max-w-4xl mx-auto">
          {/* 14-Day List Section */}
          <div className="space-y-4 sm:space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl sm:text-2xl font-light">
                  Available Dates
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  Select a date to view time slots
                </p>
              </div>
              <Button
                onClick={fetchAvailability}
                variant="ghost"
                size="sm"
                disabled={loading}
              >
                <RotateCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
            </div>

            <Card>
              <CardContent className="p-4 sm:p-6">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                      <p className="mt-4 text-sm text-muted-foreground font-light">
                        Loading availability...
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Calendar view for desktop */}
                    <div className="hidden md:block">
                      <AvailabilityCalendar
                        calendarData={calendarData}
                        quantity={quantity}
                        onDaySelect={handleDaySelect}
                        onCreateAlert={handleCreateAlert}
                      />
                    </div>

                    {/* List view for mobile */}
                    <div className="md:hidden">
                      <AvailabilityList
                        calendarData={calendarData}
                        quantity={quantity}
                        onDaySelect={handleDaySelect}
                        onCreateAlert={handleCreateAlert}
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* About Section */}
            <Card className="mt-6 bg-muted/50">
              <CardContent className="p-6 space-y-3 text-sm text-muted-foreground leading-relaxed">
                <p className="font-light">
                  Glenstone offers <strong className="font-normal">free admission</strong> with advance reservation. Timed entry tickets are released monthly.
                </p>
                <a
                  href="https://glenstone.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 hover:underline font-light text-foreground"
                >
                  Visit Glenstone.org
                  <ExternalLink className="h-3 w-3" />
                </a>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="border-t mt-24">
        <div className="container mx-auto px-4 sm:px-6 py-8 text-center text-sm text-muted-foreground font-light">
          <p>Unofficial tool • Not affiliated with Glenstone Museum</p>
        </div>
      </footer>

      {/* Time Slot Modal */}
      <TimeSlotModal
        isOpen={showTimeSlotModal}
        onClose={() => setShowTimeSlotModal(false)}
        date={selectedDate}
        sessions={sessions}
        onBook={handleBooking}
      />

      {/* Alert Form (with prefilled date) */}
      <AlertForm
        isOpen={showAlertForm}
        onClose={() => {
          setShowAlertForm(false);
          setPrefilledDate(null);
        }}
        prefilledDate={prefilledDate || undefined}
      />
    </div>
  );
}
