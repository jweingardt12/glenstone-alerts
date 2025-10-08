"use client";

import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { format, parseISO } from "date-fns";
import { ExternalLink, Bell, ArrowLeft } from "lucide-react";
import type { EventSession } from "@/lib/types";
import { AlertFormInline } from "@/components/alert-form-inline";

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
  const [view, setView] = useState<"slots" | "alert">("slots");
  const [selectedTimeOfDay, setSelectedTimeOfDay] = useState<"morning" | "midday" | "afternoon" | "any">("any");

  // Reset view when modal opens
  useEffect(() => {
    if (isOpen) {
      setView("slots");
    }
  }, [isOpen]);

  if (!date) return null;

  const availableSessions = sessions.filter((s) => !s.sold_out);
  const unavailableSessions = sessions.filter((s) => s.sold_out);
  const dateObj = parseISO(date);

  const getTimeOfDay = (sessionTime: string): "morning" | "midday" | "afternoon" => {
    const time = parseISO(sessionTime);
    const hour = time.getHours();

    if (hour < 12) return "morning";
    if (hour < 15) return "midday";
    return "afternoon";
  };

  const handleOpenAlert = (session?: EventSession) => {
    if (session) {
      const timeOfDay = getTimeOfDay(session.start_datetime);
      setSelectedTimeOfDay(timeOfDay);
    } else {
      setSelectedTimeOfDay("any");
    }
    setView("alert");
  };

  const handleCloseAlert = () => {
    setView("slots");
  };

  const handleSheetClose = (open: boolean) => {
    if (!open) {
      setView("slots");
      onClose();
    }
  };

  const renderSession = (session: EventSession) => {
    const available = session.capacity - session.used_capacity;
    const startTime = parseISO(session.start_datetime);

    return (
      <div
        key={session.id}
        className={`flex justify-between items-center p-3 rounded-sm border ${
          session.sold_out
            ? "bg-muted"
            : "bg-card"
        }`}
      >
        <span className="text-sm font-light">
          {format(startTime, "h:mm a")}
        </span>
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
              onClick={() => handleOpenAlert(session)}
            >
              <Bell className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleSheetClose}>
      <SheetContent side="right" className="p-0 gap-0 w-full sm:max-w-md flex flex-col">
        {view === "slots" ? (
          <>
            {/* Header */}
            <SheetHeader className="p-6 pb-4 border-b">
              <SheetTitle className="text-2xl font-light">
                {format(dateObj, "MMMM d, yyyy")}
              </SheetTitle>
              <SheetDescription className="text-sm font-light">
                {format(dateObj, "EEEE")} • {availableSessions.length} of {sessions.length} slots available
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
          </>
        ) : (
          <>
            {/* Alert Form View */}
            <SheetHeader className="p-6 pb-4 border-b">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={handleCloseAlert}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                  <SheetTitle className="text-2xl font-light">
                    Create Alert
                  </SheetTitle>
                  <SheetDescription className="text-sm font-light">
                    Get notified when tickets become available
                  </SheetDescription>
                </div>
              </div>
            </SheetHeader>

            <div className="overflow-y-auto flex-1">
              <AlertFormInline
                prefilledDate={date}
                prefilledTimeOfDay={selectedTimeOfDay}
                onSuccess={handleCloseAlert}
              />
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
