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

// Original time slots in ascending order
const TIME_SLOTS_ORDERED: TimeSlot[] = [
  "10:00", "10:15", "10:30", "10:45",
  "11:00", "11:15", "11:30", "11:45",
  "12:00", "12:15", "12:30", "12:45",
  "13:00", "13:15", "13:30", "13:45",
  "14:00", "14:15", "14:30", "14:45",
  "15:00", "15:15", "15:30", "15:45",
  "16:00", "16:15"
];

// Reorder for vertical flow in 4 columns (26 slots, ~7 per column)
const TIME_SLOTS: TimeSlot[] = [
  // Column 1 (7 slots)
  "10:00", "10:15", "10:30", "10:45", "11:00", "11:15", "11:30",
  // Column 2 (7 slots)
  "11:45", "12:00", "12:15", "12:30", "12:45", "13:00", "13:15",
  // Column 3 (6 slots)
  "13:30", "13:45", "14:00", "14:15", "14:30", "14:45",
  // Column 4 (6 slots)
  "15:00", "15:15", "15:30", "15:45", "16:00", "16:15"
];

// Time range presets
const TIME_RANGES = {
  morning: TIME_SLOTS_ORDERED.filter(time => {
    const hour = parseInt(time.split(":")[0]);
    return hour >= 10 && hour < 12;
  }),
  midday: TIME_SLOTS_ORDERED.filter(time => {
    const hour = parseInt(time.split(":")[0]);
    return hour >= 12 && hour < 14;
  }),
  afternoon: TIME_SLOTS_ORDERED.filter(time => {
    const hour = parseInt(time.split(":")[0]);
    return hour >= 14;
  }),
};

// Glenstone is closed Monday–Wednesday (JS Date.getDay: Mon=1, Tue=2, Wed=3)
const CLOSED_WEEKDAYS = new Set([1, 2, 3]);

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

function isClosedDay(date: Date): boolean {
  return CLOSED_WEEKDAYS.has(date.getDay());
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
    "16:00", "16:15"
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

  // Verification flow states
  const [needsVerification, setNeedsVerification] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [verificationSuccess, setVerificationSuccess] = useState(false);

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
      if (!isClosedDay(date)) {
        setSelectedDates([date]);
        form.setValue("dates", [date]);
        // Force calendar to re-render with the new selected date
        setCalendarKey((prev) => prev + 1);
      } else {
        setSelectedDates([]);
        form.setValue("dates", []);
      }
    } else if (!isOpen) {
      // Reset form and verification state when modal closes
      setSelectedDates([]);
      form.reset();
      setNeedsVerification(false);
      setVerificationSent(false);
      setVerificationCode("");
      setVerificationError(null);
      setResendCooldown(0);
      setVerificationSuccess(false);
    }
  }, [prefilledDate, isOpen, form]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Send verification code
  const sendVerificationCode = async (email: string) => {
    try {
      setVerificationError(null);
      const response = await fetch("/api/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send", email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send verification code");
      }

      if (data.needsVerification) {
        setNeedsVerification(true);
        setVerificationSent(true);
        setResendCooldown(60); // 60 second cooldown
        track("verification_code_sent");
      } else {
        // User already has alerts, skip verification
        setNeedsVerification(false);
      }

      return data.needsVerification;
    } catch (error) {
      console.error("Error sending verification code:", error);
      setVerificationError(error instanceof Error ? error.message : "Failed to send verification code");
      return false;
    }
  };

  // Verify code
  const verifyCode = async (email: string, code: string) => {
    try {
      setVerifyingCode(true);
      setVerificationError(null);

      const response = await fetch("/api/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify", email, code }),
      });

      const data = await response.json();

      if (!response.ok || !data.verified) {
        track("verification_failed");
        throw new Error(data.error || "Invalid verification code");
      }

      track("verification_success");
      return true;
    } catch (error) {
      console.error("Error verifying code:", error);
      setVerificationError(error instanceof Error ? error.message : "Invalid verification code");
      return false;
    } finally {
      setVerifyingCode(false);
    }
  };

  // Handle inline verification
  const handleVerifyCode = async () => {
    const email = form.getValues("email");
    
    if (!verificationCode || verificationCode.length !== 4) {
      setVerificationError("Please enter the 4-digit code");
      return;
    }

    const verified = await verifyCode(email, verificationCode);
    if (verified) {
      setVerificationSuccess(true);
      // Automatically proceed to create the alert after verification
      form.handleSubmit(onSubmit)();
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true);

      // Step 1: Check if email needs verification (only for new users)
      if (!needsVerification && !verificationSent && !verificationSuccess) {
        const needsVerify = await sendVerificationCode(values.email);
        if (needsVerify) {
          // Stop here and show verification UI
          setIsSubmitting(false);
          return;
        }
        // If needsVerify is false, user already has alerts, continue to create alert
      }

      // Step 2: Create the alert (verification is handled separately by inline button)
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
                        disabled={verificationSent}
                      />
                    </FormControl>
                    <FormDescription className="md:hidden">
                      We&apos;ll send notifications to this email
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Verification Code Input */}
              {verificationSent && !verificationSuccess && (
                <div className="md:col-span-2 space-y-3">
                  <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-md">
                    <p className="text-sm text-blue-900 dark:text-blue-100 font-medium mb-2">
                      Check your email
                    </p>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      We&apos;ve sent a 4-digit verification code to{" "}
                      <strong>{form.getValues("email")}</strong>. Enter it below to continue.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Verification Code</label>
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        inputMode="numeric"
                        maxLength={4}
                        placeholder="0000"
                        value={verificationCode}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, "");
                          setVerificationCode(value);
                          setVerificationError(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && verificationCode.length === 4) {
                            e.preventDefault();
                            handleVerifyCode();
                          }
                        }}
                        className="text-center text-2xl tracking-widest font-mono"
                      />
                      <Button
                        type="button"
                        onClick={handleVerifyCode}
                        disabled={verifyingCode || verificationCode.length !== 4}
                        className="shrink-0"
                      >
                        {verifyingCode ? "Verifying..." : "Verify"}
                      </Button>
                    </div>
                    {verificationError && (
                      <p className="text-sm text-red-600 dark:text-red-400">
                        {verificationError}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-sm">
                      <p className="text-muted-foreground">
                        Code expires in 10 minutes
                      </p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={resendCooldown > 0}
                        onClick={async () => {
                          const email = form.getValues("email");
                          if (email) {
                            track("verification_code_resent");
                            await sendVerificationCode(email);
                          }
                        }}
                      >
                        {resendCooldown > 0 ? `Resend (${resendCooldown}s)` : "Resend code"}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tickets</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      defaultValue={field.value.toString()}
                      disabled={verificationSent && !verificationSuccess}
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
                            const sanitizedDates = (dates || []).filter(
                              (value) => !isClosedDay(value)
                            );
                            setSelectedDates(sanitizedDates);
                            field.onChange(sanitizedDates);
                          }}
                          disabled={(date) => {
                            // Disable during verification
                            if (verificationSent && !verificationSuccess) return true;

                            const now = new Date();
                            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                            const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

                            // Disable if date is before today
                            const isPastDate = checkDate < today;

                            // Disable if date is today but after 4:15pm cutoff
                            const isToday = checkDate.getTime() === today.getTime();
                            const isPastCutoff = isToday && (now.getHours() > 16 || (now.getHours() === 16 && now.getMinutes() >= 15));

                            return isPastDate || isPastCutoff || isClosedDay(checkDate);
                          }}
                          className="rounded-md border w-full [&_.rdp]:w-full [&_.rdp-month]:w-full [&_.rdp-table]:w-full [&_.rdp-caption]:flex [&_.rdp-caption]:justify-between [&_.rdp-caption]:items-center [&_.rdp-caption]:px-2 [&_.rdp-nav]:flex [&_.rdp-nav]:space-x-1 [&_.rdp-head]:w-full [&_.rdp-head_row]:grid [&_.rdp-head_row]:grid-cols-7 [&_.rdp-head_row]:text-center [&_.rdp-tbody]:w-full [&_.rdp-tbody]:space-y-1 [&_.rdp-row]:grid [&_.rdp-row]:grid-cols-7 [&_.rdp-row]:gap-1 [&_.rdp-cell]:relative [&_.rdp-day]:h-[var(--cell-size)] [&_.rdp-day]:w-[var(--cell-size)] [&_.rdp-day]:aspect-auto [&_.rdp-day_button]:h-full [&_.rdp-day_button]:w-full [&_.rdp-day_button]:rounded-md"
                        />
                      )}
                      {selectedDates.length > 0 && (
                        <div className="text-sm text-muted-foreground">
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
                    {selectedDates.length === 0
                      ? "Select one or more dates to monitor. The museum is closed on Monday, Tuesday, and Wednesday."
                      : "Adjust your monitored dates above as needed. The museum is closed on Monday, Tuesday, and Wednesday."}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="preferredTimes"
              render={({ field }) => (
                <FormItem>
                  <div className="mb-4">
                    <FormLabel className="text-base">Preferred Time Slots</FormLabel>
                    <FormDescription>
                      Select specific times you&apos;d prefer. Leave unchecked to accept any time.
                    </FormDescription>
                  </div>

                  {/* Preset buttons */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={verificationSent && !verificationSuccess}
                      onClick={() => {
                        const currentTimes = field.value || [];
                        const morningTimes = TIME_RANGES.morning.filter(time =>
                          !selectedDates.some(date => isTimeSlotInPast(date, time))
                        );
                        const newTimes = Array.from(new Set([...currentTimes, ...morningTimes]));
                        field.onChange(newTimes);
                      }}
                    >
                      Morning
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={verificationSent && !verificationSuccess}
                      onClick={() => {
                        const currentTimes = field.value || [];
                        const middayTimes = TIME_RANGES.midday.filter(time =>
                          !selectedDates.some(date => isTimeSlotInPast(date, time))
                        );
                        const newTimes = Array.from(new Set([...currentTimes, ...middayTimes]));
                        field.onChange(newTimes);
                      }}
                    >
                      Mid-day
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={verificationSent && !verificationSuccess}
                      onClick={() => {
                        const currentTimes = field.value || [];
                        const afternoonTimes = TIME_RANGES.afternoon.filter(time =>
                          !selectedDates.some(date => isTimeSlotInPast(date, time))
                        );
                        const newTimes = Array.from(new Set([...currentTimes, ...afternoonTimes]));
                        field.onChange(newTimes);
                      }}
                    >
                      Afternoon
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={verificationSent && !verificationSuccess}
                      onClick={() => field.onChange([])}
                    >
                      Clear
                    </Button>
                  </div>

                  <div className="grid grid-cols-4 gap-x-4 gap-y-2 max-h-48 overflow-y-auto">
                    {TIME_SLOTS.map((time) => {
                      // Check if any selected date is today and if this time is in the past
                      const isPastTime = selectedDates.some((date) => isTimeSlotInPast(date, time));
                      const isDisabledForVerification = verificationSent && !verificationSuccess;

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
                                    disabled={isPastTime || isDisabledForVerification}
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
                                <FormLabel className={`text-sm font-normal ${isPastTime || isDisabledForVerification ? "opacity-50 cursor-not-allowed" : ""}`}>
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
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isSubmitting || verifyingCode || (verificationSent && !verificationSuccess)}
              >
                {isSubmitting
                  ? "Creating Alert..."
                  : verificationSent && !verificationSuccess
                  ? "Verify code above to continue"
                  : "Create Alert"}
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
