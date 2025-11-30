"use client";

import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { AlertModal } from "@/components/alert-modal";
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
import { Calendar } from "@/components/ui/calendar";
import type { Alert } from "@/lib/types";

const formSchema = z.object({
  email: z.string().email("Invalid email address"),
  dates: z.array(z.date()).min(1, "Select at least one date"),
  timeOfDay: z.enum(["morning", "midday", "afternoon", "any"]),
  quantity: z.number().min(1).max(10),
});

interface AlertFormInlineProps {
  onSuccess?: (alert?: Alert) => void;
  prefilledDate?: string; // YYYY-MM-DD format
  prefilledTimeOfDay?: "morning" | "midday" | "afternoon" | "any";
}

export function AlertFormInline({ onSuccess, prefilledDate, prefilledTimeOfDay }: AlertFormInlineProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [alertModal, setAlertModal] = useState<{
    isOpen: boolean;
    type: "success" | "error" | "info";
    title: string;
    message: string;
  }>({
    isOpen: false,
    type: "success",
    title: "",
    message: "",
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      dates: [],
      timeOfDay: "any",
      quantity: 2,
    },
  });

  // Auto-fill date and time of day if provided
  useEffect(() => {
    if (prefilledDate) {
      // Parse date with timezone-safe approach (YYYY-MM-DD format)
      const dateParts = prefilledDate.split('-').map(Number);
      const date = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
      setSelectedDates([date]);
      form.setValue("dates", [date]);
    }
    if (prefilledTimeOfDay) {
      form.setValue("timeOfDay", prefilledTimeOfDay);
    }
  }, [prefilledDate, prefilledTimeOfDay, form]);

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
          timeOfDay: values.timeOfDay,
          quantity: values.quantity,
        }),
      });

      const data = await response.json();

      // Handle error responses
      if (!response.ok) {
        // If it's a duplicate alert, show a helpful message but don't throw
        if (data.existingAlert) {
          // Reset form
          form.reset();
          setSelectedDates([]);

          setAlertModal({
            isOpen: true,
            type: "info",
            title: "Alert Already Exists",
            message: data.error,
          });

          if (onSuccess) {
            onSuccess();
          }
          return;
        }

        throw new Error(data.error || "Failed to create alert");
      }

      // Reset form
      form.reset();
      setSelectedDates([]);

      // New alert created successfully
      const { alert: createdAlert } = data;

      if (onSuccess) {
        onSuccess(createdAlert);
      }

      setAlertModal({
        isOpen: true,
        type: "success",
        title: "Alert Created",
        message: "You'll receive an email notification when tickets become available for your selected dates.",
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
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-6">
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
                <FormDescription>
                  We&apos;ll send notifications to this email
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="dates"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Select Dates</FormLabel>
                <FormControl>
                  <div className="space-y-2">
                    <Calendar
                      mode="multiple"
                      selected={selectedDates}
                      onSelect={(dates) => {
                        setSelectedDates(dates || []);
                        field.onChange(dates || []);
                      }}
                      disabled={(date) => date < new Date()}
                      className="rounded-md border"
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
                  Select one or more dates to monitor
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="timeOfDay"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Time of Day Preference</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select time preference" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="any">Any Time</SelectItem>
                    <SelectItem value="morning">Morning</SelectItem>
                    <SelectItem value="midday">Midday</SelectItem>
                    <SelectItem value="afternoon">Afternoon</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Number of Tickets</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                  />
                </FormControl>
                <FormDescription>How many tickets do you need?</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full bg-stone-900 hover:bg-stone-800 text-white" disabled={isSubmitting}>
            {isSubmitting ? "Creating Alert..." : "Create Alert"}
          </Button>
        </form>
      </Form>

      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal({ ...alertModal, isOpen: false })}
        type={alertModal.type}
        title={alertModal.title}
        message={alertModal.message}
      />
    </>
  );
}
