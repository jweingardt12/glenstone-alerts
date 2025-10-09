"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { AlertForm } from "@/components/alert-form";
import { AvailabilityList } from "@/components/availability-list";
import { AvailabilityCalendar } from "@/components/availability-calendar";
import { TimeSlotModal } from "@/components/time-slot-modal";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
// import { format, parseISO } from "date-fns";
import { ExternalLink, RotateCw } from "lucide-react";
import type { CalendarDate, CalendarResponse, EventSession } from "@/lib/types";
import { generateBookingUrl } from "@/lib/glenstone-api";

export default function Home() {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [sessions, setSessions] = useState<EventSession[]>([]);
  const [calendarData, setCalendarData] = useState<CalendarDate[]>([]);
  const [loading, setLoading] = useState(true);
  const quantity = 2;

  // Modal states
  const [showTimeSlotModal, setShowTimeSlotModal] = useState(false);
  const [showAlertForm, setShowAlertForm] = useState(false);
  const [prefilledDate, setPrefilledDate] = useState<string | null>(null);

  const fetchAvailability = useCallback(async () => {
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
  }, [quantity]);

  useEffect(() => {
    void fetchAvailability();
  }, [fetchAvailability]);

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
      {/* Hero Header */}
      <header className="relative w-full h-[200px] sm:h-[250px] md:h-[300px] overflow-hidden">
        {/* Background Image */}
        <Image
          src="/glenstone.jpeg"
          alt="Glenstone Museum"
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />

        {/* Gradient Overlay for text contrast */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/60 dark:from-black/70 dark:via-black/50 dark:to-black/70 transition-colors duration-300" />

        {/* Content */}
        <div className="relative h-full container mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex items-start justify-between h-full">
            <div className="flex items-end h-full pb-8 sm:pb-12">
              <div className="space-y-1">
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-light tracking-wide text-white drop-shadow-lg">
                  Glenstone Alerts
                </h1>
                <p className="text-sm sm:text-base md:text-lg text-white/90 font-light drop-shadow-md">
                  Free admission • Advance reservation required
                </p>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="max-w-5xl mx-auto">
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
              <div className="flex items-center gap-2">
                <AlertForm showTrigger={true} />
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

            {/* FAQ Section */}
            <Card className="mt-6">
              <CardContent className="p-6 space-y-6">
                <h2 className="text-xl sm:text-2xl font-light">
                  Frequently Asked Questions
                </h2>

                <div className="space-y-4 text-sm">
                  <div>
                    <h3 className="font-normal text-foreground mb-2">How does this work?</h3>
                    <p className="text-muted-foreground font-light leading-relaxed">
                      This tool checks Glenstone's ticket availability hourly. Create an alert by selecting your preferred dates, and we'll email you when tickets become available.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-normal text-foreground mb-2">Is this official?</h3>
                    <p className="text-muted-foreground font-light leading-relaxed">
                      No, this is an unofficial tool created to help visitors secure tickets. It is not affiliated with or endorsed by Glenstone Museum.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-normal text-foreground mb-2">When are tickets released?</h3>
                    <p className="text-muted-foreground font-light leading-relaxed">
                      Glenstone typically releases tickets one month in advance. New dates are usually added on the first business day of each month, though this can vary.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-normal text-foreground mb-2">How much do tickets cost?</h3>
                    <p className="text-muted-foreground font-light leading-relaxed">
                      Admission to Glenstone Museum is completely free, but advance reservation is required. This service is also free.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-normal text-foreground mb-2">Can I change my alert settings?</h3>
                    <p className="text-muted-foreground font-light leading-relaxed">
                      Yes, each alert email includes a management link where you can update your preferences or unsubscribe at any time.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-24">
        <div className="container mx-auto px-4 sm:px-6 py-8">
          <div className="max-w-5xl mx-auto space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm">
              <a
                href="https://github.com/jweingardt12/glenstone-alerts"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 hover:underline text-muted-foreground font-light"
              >
                GitHub
                <ExternalLink className="h-3 w-3" />
              </a>
              <span className="hidden sm:inline text-muted-foreground">•</span>
              <a
                href="https://jwe.in"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 hover:underline text-muted-foreground font-light"
              >
                jwe.in
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground font-light inline-flex items-center justify-center gap-1 flex-wrap">
                Weather from{""}
                <a
                  href="https://weather-data.apple.com/legal-attribution.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline inline-flex items-center"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-3.5 w-3.5"
                    aria-label="Apple"
                  >
                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                  </svg>
                  Weather
                </a>
              </p>
              <p className="text-sm text-muted-foreground font-light">
                Unofficial tool • Not affiliated with Glenstone Museum
              </p>
            </div>
          </div>
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
