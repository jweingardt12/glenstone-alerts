"use client";

import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WeatherCalendar } from "@/components/weather-calendar";
import { AlertModal } from "@/components/alert-modal";
import type { Alert, TimeSlot } from "@/lib/types";

// Time slots in ascending order
const TIME_SLOTS_ORDERED: TimeSlot[] = [
  "10:00", "10:15", "10:30", "10:45",
  "11:00", "11:15", "11:30", "11:45",
  "12:00", "12:15", "12:30", "12:45",
  "13:00", "13:15", "13:30", "13:45",
  "14:00", "14:15", "14:30", "14:45",
  "15:00", "15:15", "15:30", "15:45",
  "16:00", "16:15"
];

// Reordered for vertical flow in 4 columns
const TIME_SLOTS: TimeSlot[] = [
  "10:00", "10:15", "10:30", "10:45", "11:00", "11:15", "11:30",
  "11:45", "12:00", "12:15", "12:30", "12:45", "13:00", "13:15",
  "13:30", "13:45", "14:00", "14:15", "14:30", "14:45",
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

// Closed weekdays (Mon, Tue, Wed)
const CLOSED_WEEKDAYS = new Set([1, 2, 3]);

function formatTimeLabel(time: TimeSlot): string {
  const [hourStr, minuteStr] = time.split(":");
  const hour = parseInt(hourStr);
  const minute = minuteStr;

  if (hour === 12) return `12:${minute} PM`;
  if (hour > 12) return `${hour - 12}:${minute} PM`;
  return `${hour}:${minute} AM`;
}

function isTimeSlotInPast(date: Date, timeSlot: TimeSlot): boolean {
  const today = new Date();
  const dateStr = format(date, "yyyy-MM-dd");
  const todayStr = format(today, "yyyy-MM-dd");

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

interface AlertEditFormProps {
  alert: Alert;
  onSuccess: (alert: Alert) => void;
  onCancel: () => void;
}

export function AlertEditForm({ alert, onSuccess, onCancel }: AlertEditFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [calendarKey, setCalendarKey] = useState(0);
  const [errorModal, setErrorModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
  }>({
    isOpen: false,
    title: "",
    message: "",
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      dates: alert.dates.map(dateStr => {
        const [year, month, day] = dateStr.split('-').map(Number);
        return new Date(year, month - 1, day);
      }),
      preferredTimes: alert.preferredTimes || [],
      quantity: alert.quantity,
    },
  });

  // Initialize selected dates from alert
  useEffect(() => {
    const dates = alert.dates.map(dateStr => {
      const [year, month, day] = dateStr.split('-').map(Number);
      return new Date(year, month - 1, day);
    });
    setSelectedDates(dates);
    form.setValue("dates", dates);
    setCalendarKey(prev => prev + 1);
  }, [alert, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true);

      const response = await fetch(`/api/alerts/${alert.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dates: values.dates.map((date) => format(date, "yyyy-MM-dd")),
          preferredTimes: values.preferredTimes,
          quantity: values.quantity,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update alert");
      }

      onSuccess(data.alert);
    } catch (error) {
      console.error("Error updating alert:", error);
      const message = error instanceof Error ? error.message : "Failed to update alert";
      setErrorModal({
        isOpen: true,
        title: "Update Failed",
        message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0">
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="space-y-4 md:space-y-0 md:grid md:grid-cols-[1fr,140px] md:gap-4">
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
                        const now = new Date();
                        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                        const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

                        const isPastDate = checkDate < today;
                        const isToday = checkDate.getTime() === today.getTime();
                        const isPastCutoff = isToday && (now.getHours() > 16 || (now.getHours() === 16 && now.getMinutes() >= 15));

                        return isPastDate || isPastCutoff || isClosedDay(checkDate);
                      }}
                      className="rounded-md border w-full"
                    />
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
                  {selectedDates.length === 0
                    ? "Select one or more dates to monitor."
                    : "Adjust your monitored dates above as needed."}
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

                <div className="flex flex-wrap gap-2 mb-4">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
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
                    onClick={() => field.onChange([])}
                  >
                    Clear
                  </Button>
                </div>

                <div className="grid grid-cols-4 gap-x-4 gap-y-2 max-h-48 overflow-y-auto">
                  {TIME_SLOTS.map((time) => {
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

        <div className="border-t p-6 bg-background flex-shrink-0 flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>

      <AlertModal
        isOpen={errorModal.isOpen}
        onClose={() => setErrorModal({ ...errorModal, isOpen: false })}
        type="error"
        title={errorModal.title}
        message={errorModal.message}
      />
    </Form>
  );
}
