"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { AlertForm } from "@/components/alert-form";
import { AvailabilityList } from "@/components/availability-list";
import { AvailabilityCalendar } from "@/components/availability-calendar";
import { TimeSlotModal } from "@/components/time-slot-modal";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { CalendarSkeleton, ListSkeleton } from "@/components/calendar-skeleton";
import { AnimatedBlurBackground } from "@/components/animated-blur-background";
// import { format, parseISO } from "date-fns";
import { ExternalLink, RotateCw } from "lucide-react";
import type {
  CalendarDate,
  CalendarResponse,
  EventSession,
} from "@/lib/types";
import { generateBookingUrl } from "@/lib/glenstone-api";
import { useOpenPanel } from "@openpanel/nextjs";

// Removed header weather display and related helpers

export default function Home() {
  const { track } = useOpenPanel();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [sessions, setSessions] = useState<EventSession[]>([]);
  const [calendarData, setCalendarData] = useState<CalendarDate[]>([]);
  const [loading, setLoading] = useState(true);
  const quantity = 2;

  // Cycle through art-related emojis in the footer
  const emojis = useMemo(
    () => [
      // Art + creative
      '❤️','💙','💚','💛','💜','🧡','💛','💚','💙','💜','🧡','❤️'
    ],
    []
  );
  const [emojiIndex, setEmojiIndex] = useState(0);
  useEffect(() => {
    const getRandomInterval = () => Math.random() * 1500 + 800; // Random interval between 800-2300ms
    let timeoutId: NodeJS.Timeout;

    const scheduleNext = () => {
      timeoutId = setTimeout(() => {
        setEmojiIndex((i) => (i + 1) % emojis.length);
        scheduleNext();
      }, getRandomInterval());
    };

    scheduleNext();
    return () => clearTimeout(timeoutId);
  }, [emojis.length]);
  const artEmoji = emojis[emojiIndex];

  // Modal states
  const [showTimeSlotModal, setShowTimeSlotModal] = useState(false);
  const [showAlertForm, setShowAlertForm] = useState(false);
  const [prefilledDate, setPrefilledDate] = useState<string | null>(null);
  // Weather badge removed from header

  const fetchAvailability = useCallback(async (isManualRefresh = false) => {
    try {
      setLoading(true);
      if (isManualRefresh) {
        track("availability_refreshed");
      }

      // Start both the fetch and the minimum delay timer
      const [response] = await Promise.all([
        fetch(`/api/availability?quantity=${quantity}`),
        new Promise(resolve => setTimeout(resolve, 1000)) // Minimum 1 second
      ]);

      if (!response.ok) throw new Error("Failed to fetch availability");
      const data: CalendarResponse = await response.json();
      setCalendarData(data.calendar._data);
    } catch (err) {
      console.error("Error fetching availability:", err);
    } finally {
      setLoading(false);
    }
  }, [quantity, track]);

  useEffect(() => {
    void fetchAvailability();
  }, [fetchAvailability]);

  // Removed current weather polling

  const handleDaySelect = (date: string, daySessions: EventSession[]) => {
    setSelectedDate(date);
    setSessions(daySessions);
    setShowTimeSlotModal(true);
    track("time_slot_viewed", {
      date,
      availableSlots: daySessions.length,
    });
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
      track("booking_link_clicked", {
        date: selectedDate,
        quantity,
      });
      window.open(generateBookingUrl(selectedDate, quantity), "_blank");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Header */}
      <header className="relative w-full h-[220px] sm:h-[250px] md:h-[300px] overflow-hidden">
        {/* Animated Blur Background */}
        <AnimatedBlurBackground />

        {/* Gradient Overlay for text contrast */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/50 dark:from-black/60 dark:via-black/40 dark:to-black/60 transition-colors duration-300" />

        {/* Content */}
        <div className="relative h-full container mx-auto px-4 sm:px-6 py-4 sm:py-8">
          <div className="max-w-5xl mx-auto h-full">
            {/* Theme toggle - absolute positioned */}
            <div className="absolute top-4 right-4 z-10">
              <ThemeToggle />
            </div>

            <div className="flex h-full items-end justify-center pb-4 sm:pb-12 pt-12 sm:pt-0">
              <div className="flex flex-col items-center gap-3 text-center">
                <Link href="/" className="transition-transform hover:scale-105 shrink-0">
                  <div className="relative w-16 h-16 sm:w-24 sm:h-24 md:w-28 md:h-28">
                    <Image
                      src="/logo.webp"
                      alt="Glenstone Alerts Logo"
                      fill
                      priority
                      sizes="(min-width: 640px) 80px, 64px"
                      className="rounded-lg object-contain"
                    />
                  </div>
                </Link>
                <div className="space-y-1">
                  <Link href="/">
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-light tracking-wide text-white drop-shadow-lg hover:text-white/90 transition-colors">
                      Glenstone Alerts
                    </h1>
                  </Link>
                  <p className="text-xs sm:text-sm md:text-base text-white/90 font-light drop-shadow-md max-w-[36ch] md:max-w-none">
                    A simple tool to help reserve free timed entry passes for the{" "}
                    <a
                      href="https://glenstone.org"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:text-white transition-colors inline-flex items-center gap-1"
                    >
                      Glenstone Museum
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </p>
                </div>
              </div>
            </div>
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
                  onClick={() => fetchAvailability(true)}
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
                  <>
                    {/* Calendar skeleton for desktop */}
                    <div className="hidden md:block">
                      <CalendarSkeleton />
                    </div>

                    {/* List skeleton for mobile */}
                    <div className="md:hidden">
                      <ListSkeleton />
                    </div>
                  </>
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
                      This tool checks Glenstone&apos;s ticket availability every 10 minutes. Create an alert by selecting your preferred dates, and we&apos;ll email you when tickets become available. You&apos;ll still need to check out on the Glenstone site - all this does is notify you when tickets become available.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-normal text-foreground mb-2">Is this official?</h3>
                    <p className="text-muted-foreground font-light leading-relaxed">
                      No, this is an unofficial tool created to help visitors secure tickets. It is not affiliated with or endorsed by Glenstone Museum
                    </p>
                  </div>

                  <div>
                    <h3 className="font-normal text-foreground mb-2">Why make this?</h3>
                    <p className="text-muted-foreground font-light leading-relaxed">
                      Glenstone is great, but it can be hard to plan an outing on short notice or for groups. This tool helps people plan ahead and get notified when availability opens up for their preferred dates and party size.
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
            <p className="text-muted-foreground font-light text-center text-sm">
              Made with {artEmoji} by{" "}
              <a
                href="https://jwe.in"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                <span className="font-semibold">Jason</span> in Potomac, MD
              </a>
            </p>
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
                href="https://dashboard.openpanel.dev/share/overview/d4VJHz"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 hover:underline text-muted-foreground font-light"
              >
                Site stats
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
                Not affiliated with Glenstone Museum
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
