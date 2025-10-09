"use client";

import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { format, parseISO } from "date-fns";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AlertModal } from "@/components/alert-modal";
import { Checkbox } from "@/components/ui/checkbox";
import { useOpenPanel } from "@openpanel/nextjs";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WeatherCalendar } from "@/components/weather-calendar";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { Alert, TimeSlot } from "@/lib/types";

const TIME_SLOTS: TimeSlot[] = [
  "10:00", "10:15", "10:30", "10:45",
  "11:00", "11:15", "11:30", "11:45",
  "12:00", "12:15", "12:30", "12:45",
  "13:00", "13:15", "13:30", "13:45",
  "14:00", "14:15", "14:30", "14:45",
  "15:00", "15:15", "15:30", "15:45",
  "16:00", "16:15", "16:30", "16:45",
  "17:00"
];

// Helper to format time slots for display
function formatTimeLabel(time: TimeSlot): string {
  const [hourStr, minuteStr] = time.split(":");
  const hour = parseInt(hourStr);
  const minute = minuteStr;

  if (hour === 12) return `12:${minute} PM`;
  if (hour > 12) return `${hour - 12}:${minute} PM`;
  return `${hour}:${minute} AM`;
}

// Helper to check if a time slot is in the past for a given date
function isTimeSlotInPast(date: Date, timeSlot: TimeSlot): boolean {
  const today = new Date();
  const dateStr = format(date, "yyyy-MM-dd");
  const todayStr = format(today, "yyyy-MM-dd");

  // Only check if it's today
  if (dateStr !== todayStr) return false;

  const [hourStr, minuteStr] = timeSlot.split(":");
  const hour = parseInt(hourStr);
  const minute = parseInt(minuteStr);

  const slotTime = new Date();
  slotTime.setHours(hour, minute, 0, 0);

  return slotTime < today;
}

const formSchema = z.object({
  email: z.string().email("Invalid email address"),
  dates: z.array(z.date()).min(1, "Select at least one date"),
  preferredTimes: z.array(z.enum([
    "10:00", "10:15", "10:30", "10:45",
    "11:00", "11:15", "11:30", "11:45",
    "12:00", "12:15", "12:30", "12:45",
    "13:00", "13:15", "13:30", "13:45",
    "14:00", "14:15", "14:30", "14:45",
    "15:00", "15:15", "15:30", "15:45",
    "16:00", "16:15", "16:30", "16:45",
    "17:00"
  ] as const)).optional(),
  quantity: z.number().min(1).max(10),
});

interface AlertFormProps {
  onSuccess?: (alert: Alert) => void;
  prefilledDate?: string; // YYYY-MM-DD format
  isOpen?: boolean;
  onClose?: () => void;
  showTrigger?: boolean; // whether to render the visible trigger button
}

export function AlertForm({ onSuccess, prefilledDate, isOpen: controlledIsOpen, onClose, showTrigger = false }: AlertFormProps) {
  const { track } = useOpenPanel();
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [calendarKey, setCalendarKey] = useState(0);
  const [alertModal, setAlertModal] = useState<{
    isOpen: boolean;
    type: "success" | "error" | "info";
    title: string;
    message: string;
    actionLabel?: string;
    actionUrl?: string;
  }>({
    isOpen: false,
    type: "success",
    title: "",
    message: "",
  });

  // Support controlled or uncontrolled mode
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  const setIsOpen = onClose !== undefined
    ? (open: boolean) => { 
        if (!open) onClose(); 
      }
    : setInternalIsOpen;

  // Force calendar re-render after sheet animation
  useEffect(() => {
    if (isOpen) {
      track("alert_modal_opened");
      const timer = setTimeout(() => {
        setCalendarKey((prev) => prev + 1);
      }, 300); // Wait for sheet animation to complete
      return () => clearTimeout(timer);
    }
  }, [isOpen, track]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      dates: [],
      preferredTimes: [],
      quantity: 2,
    },
  });

  // Auto-fill date if provided or reset when modal closes
  useEffect(() => {
    if (isOpen && prefilledDate) {
      const date = parseISO(prefilledDate);
      setSelectedDates([date]);
      form.setValue("dates", [date]);
      // Force calendar to re-render with the new selected date
      setCalendarKey((prev) => prev + 1);
    } else if (!isOpen) {
      // Reset form when modal closes
      setSelectedDates([]);
      form.reset();
    }
  }, [prefilledDate, isOpen, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true);

      const response = await fetch("/api/alerts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: values.email,
          dates: values.dates.map((date) => format(date, "yyyy-MM-dd")),
          preferredTimes: values.preferredTimes,
          quantity: values.quantity,
        }),
      });

      const data = await response.json();

      // Handle error responses
      if (!response.ok) {
        // If it's a duplicate alert, show a helpful message but don't throw
        if (data.existingAlert) {
          // Reset form and close dialog
          form.reset();
          setSelectedDates([]);
          setIsOpen(false);

          setAlertModal({
            isOpen: true,
            type: "info",
            title: "Alert Already Exists",
            message: data.error,
          });
          return;
        }

        throw new Error(data.error || "Failed to create alert");
      }

      // Reset form and close dialog
      form.reset();
      setSelectedDates([]);
      setIsOpen(false);

      // New alert created successfully
      const { alert: createdAlert } = data;

      // Track alert creation
      track("alert_created", {
        quantity: values.quantity,
        dateCount: values.dates.length,
        hasPreferredTimes: (values.preferredTimes?.length || 0) > 0,
      });

      if (onSuccess) {
        onSuccess(createdAlert);
      }

      setAlertModal({
        isOpen: true,
        type: "success",
        title: "Alert Created",
        message: "You'll receive an email notification when tickets become available for your selected dates. Check your email for a link to manage your alerts.",
      });
    } catch (error) {
      console.error("Error creating alert:", error);
      setAlertModal({
        isOpen: true,
        type: "error",
        title: "Failed to Create Alert",
        message: error instanceof Error ? error.message : "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        {showTrigger && (
          <SheetTrigger asChild>
            <Button size="lg" className="gap-2">
              <Bell className="h-5 w-5" />
              Create Alert
            </Button>
          </SheetTrigger>
        )}
      <SheetContent side="right" className="w-full sm:max-w-2xl p-0 flex flex-col h-full">
        <SheetHeader className="px-6 pt-6 pb-4 border-b flex-shrink-0">
          <SheetTitle className="text-2xl font-light">Create Availability Alert</SheetTitle>
          <SheetDescription className="text-sm font-light">
            Get notified via email when tickets become available for your selected dates.
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0">
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="space-y-4 md:space-y-0 md:grid md:grid-cols-[1fr,140px] md:gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="you@example.com"
                        type="email"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="md:hidden">
                      We&apos;ll send notifications to this email
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tickets</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      defaultValue={field.value.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select quantity" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="1">1 ticket</SelectItem>
                        <SelectItem value="2">2 tickets</SelectItem>
                        <SelectItem value="3">3 tickets</SelectItem>
                        <SelectItem value="4">4 tickets</SelectItem>
                        <SelectItem value="5">5 tickets</SelectItem>
                        <SelectItem value="6">6 tickets</SelectItem>
                        <SelectItem value="7">7 tickets</SelectItem>
                        <SelectItem value="8">8 tickets</SelectItem>
                        <SelectItem value="9">9 tickets</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              </div>

              <FormField
              control={form.control}
              name="dates"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Select Dates</FormLabel>
                  <FormControl>
                    <div className="space-y-2 w-full">
                      {isOpen && (
                        <WeatherCalendar
                          key={calendarKey}
                          mode="multiple"
                          selected={selectedDates}
                          defaultMonth={selectedDates.length > 0 ? selectedDates[0] : undefined}
                          onSelect={(dates) => {
                            setSelectedDates(dates || []);
                            field.onChange(dates || []);
                          }}
                          disabled={(date) => {
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            const checkDate = new Date(date);
                            checkDate.setHours(0, 0, 0, 0);
                            return checkDate < today;
                          }}
                          className="rounded-md border w-full [&_.rdp]:w-full [&_.rdp-month]:w-full [&_.rdp-table]:w-full [&_.rdp-caption]:flex [&_.rdp-caption]:justify-between [&_.rdp-caption]:items-center [&_.rdp-caption]:px-2 [&_.rdp-nav]:flex [&_.rdp-nav]:space-x-1 [&_.rdp-head]:w-full [&_.rdp-head_row]:grid [&_.rdp-head_row]:grid-cols-7 [&_.rdp-head_row]:text-center [&_.rdp-tbody]:w-full [&_.rdp-tbody]:space-y-1 [&_.rdp-row]:grid [&_.rdp-row]:grid-cols-7 [&_.rdp-row]:gap-1 [&_.rdp-cell]:relative [&_.rdp-day]:h-12 [&_.rdp-day]:w-full [&_.rdp-day]:aspect-square [&_.rdp-day_button]:h-full [&_.rdp-day_button]:w-full [&_.rdp-day_button]:rounded-md"
                        />
                      )}
                      {selectedDates.length > 0 && (
                        <div className="text-sm text-gray-600">
                          Selected {selectedDates.length} date
                          {selectedDates.length !== 1 ? "s" : ""}:{" "}
                          {selectedDates
                            .map((d) => format(d, "MMM d, yyyy"))
                            .join(", ")}
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormDescription>
                    Select one or more dates to monitor
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="preferredTimes"
              render={() => (
                <FormItem>
                  <div className="mb-4">
                    <FormLabel className="text-base">Preferred Time Slots</FormLabel>
                    <FormDescription>
                      Select specific times you&apos;d prefer. Leave unchecked to accept any time.
                    </FormDescription>
                  </div>
                  <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                    {TIME_SLOTS.map((time) => {
                      // Check if any selected date is today and if this time is in the past
                      const isPastTime = selectedDates.some((date) => isTimeSlotInPast(date, time));

                      return (
                        <FormField
                          key={time}
                          control={form.control}
                          name="preferredTimes"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={time}
                                className="flex flex-row items-start space-x-3 space-y-0"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(time)}
                                    disabled={isPastTime}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...(field.value || []), time])
                                        : field.onChange(
                                            field.value?.filter(
                                              (value) => value !== time
                                            )
                                          );
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className={`text-sm font-normal ${isPastTime ? "opacity-50 cursor-not-allowed" : ""}`}>
                                  {formatTimeLabel(time)}
                                </FormLabel>
                              </FormItem>
                            );
                          }}
                        />
                      );
                    })}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            </div>

            <div className="border-t p-6 bg-background flex-shrink-0">
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Creating Alert..." : "Create Alert"}
              </Button>
            </div>
          </form>
        </Form>
        </SheetContent>
      </Sheet>

      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal({ ...alertModal, isOpen: false })}
        type={alertModal.type}
        title={alertModal.title}
        message={alertModal.message}
        actionLabel={alertModal.actionLabel}
        actionUrl={alertModal.actionUrl}
      />
    </>
  );
}
