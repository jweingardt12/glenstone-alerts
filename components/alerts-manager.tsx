"use client";

import { useState } from "react";
import type { Alert } from "@/lib/types";
import { AlertModal } from "@/components/alert-modal";
import { AlertEditForm } from "@/components/alert-edit-form";
import { useOpenPanel } from "@openpanel/nextjs";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface AlertsManagerProps {
  initialAlerts: Alert[];
}

export function AlertsManager({ initialAlerts }: AlertsManagerProps) {
  const { track } = useOpenPanel();
  const [alerts, setAlerts] = useState<Alert[]>(initialAlerts);
  const [editingAlert, setEditingAlert] = useState<Alert | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
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

  const formatDate = (dateStr: string) => {
    // Parse YYYY-MM-DD format and create date in local timezone to avoid timezone shifts
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTimeSlot = (time: string): string => {
    const [hourStr, minuteStr] = time.split(":");
    const hour = parseInt(hourStr);
    const minute = minuteStr;

    if (hour === 12) return `12:${minute} PM`;
    if (hour > 12) return `${hour - 12}:${minute} PM`;
    return `${hour}:${minute} AM`;
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this alert?")) {
      return;
    }

    setLoading(id);
    try {
      const response = await fetch(`/api/alerts/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete alert");
      }

      track("alert_deleted");
      setAlerts((prevAlerts) => prevAlerts.filter((alert) => alert.id !== id));
      setAlertModal({
        isOpen: true,
        type: "success",
        title: "Alert Deleted",
        message: "Your alert has been successfully deleted.",
      });
    } catch (error) {
      console.error("Error deleting alert:", error);
      setAlertModal({
        isOpen: true,
        type: "error",
        title: "Failed to Delete",
        message: "Failed to delete alert. Please try again.",
      });
    } finally {
      setLoading(null);
    }
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    setLoading(id);
    try {
      const response = await fetch(`/api/alerts/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ active: !currentActive }),
      });

      if (!response.ok) {
        throw new Error("Failed to update alert");
      }

      const { alert: updatedAlert } = await response.json();
      setAlerts((prevAlerts) =>
        prevAlerts.map((alert) => (alert.id === id ? updatedAlert : alert))
      );
      track(updatedAlert.active ? "alert_activated" : "alert_paused");
    } catch (error) {
      console.error("Error updating alert:", error);
      setAlertModal({
        isOpen: true,
        type: "error",
        title: "Failed to Update",
        message: "Failed to update alert. Please try again.",
      });
    } finally {
      setLoading(null);
    }
  };

  if (alerts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-stone-400 text-lg font-light">
          You don&apos;t have any alerts set up yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className={`border border-stone-200 rounded-sm p-6 ${
            alert.active ? "bg-white" : "bg-stone-50"
          }`}
        >
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <h3 className="text-lg font-light text-stone-900">
                  {alert.quantity} {alert.quantity === 1 ? "Ticket" : "Tickets"}
                </h3>
                <span
                  className={`px-3 py-1 text-xs font-light rounded-full border ${
                    alert.active
                      ? "bg-white border-stone-300 text-stone-900"
                      : "bg-stone-100 border-stone-200 text-stone-600"
                  }`}
                >
                  {alert.active ? "Active" : "Inactive"}
                </span>
              </div>

              <div className="space-y-2 text-sm text-stone-600 font-light leading-relaxed">
                <div>
                  <strong className="font-normal text-stone-900">Dates:</strong>{" "}
                  {alert.dates.map((date) => formatDate(date)).join(", ")}
                </div>
                <div>
                  <strong className="font-normal text-stone-900">Time Preference:</strong>{" "}
                  {alert.preferredTimes && alert.preferredTimes.length > 0
                    ? alert.preferredTimes.map((time) => formatTimeSlot(time)).join(", ")
                    : "Any time"}
                </div>
                {alert.minCapacity && (
                  <div>
                    <strong className="font-normal text-stone-900">Minimum Capacity:</strong> {alert.minCapacity} slots
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2 ml-4">
              <button
                onClick={() => {
                  track("alert_edit_opened");
                  setEditingAlert(alert);
                }}
                disabled={loading === alert.id}
                className="px-4 py-2 bg-white border border-stone-300 text-stone-700 rounded-sm text-sm font-light hover:bg-stone-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 ease-in-out active:scale-95"
              >
                Edit
              </button>
              <button
                onClick={() => handleToggleActive(alert.id, alert.active)}
                disabled={loading === alert.id}
                className={`px-4 py-2 rounded-sm text-sm font-light border transition-all duration-200 ease-in-out active:scale-95 ${
                  alert.active
                    ? "bg-stone-50 border-stone-300 text-stone-700 hover:bg-stone-100"
                    : "bg-white border-stone-300 text-stone-900 hover:bg-stone-50"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {loading === alert.id
                  ? "..."
                  : alert.active
                  ? "Pause"
                  : "Activate"}
              </button>
              <button
                onClick={() => handleDelete(alert.id)}
                disabled={loading === alert.id}
                className="px-4 py-2 bg-white border border-stone-300 text-stone-700 rounded-sm text-sm font-light hover:bg-stone-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 ease-in-out active:scale-95"
              >
                {loading === alert.id ? "..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      ))}

      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal({ ...alertModal, isOpen: false })}
        type={alertModal.type}
        title={alertModal.title}
        message={alertModal.message}
      />

      {/* Edit Alert Sheet */}
      <Sheet open={editingAlert !== null} onOpenChange={(open) => !open && setEditingAlert(null)}>
        <SheetContent side="right" className="w-full sm:max-w-2xl p-0 flex flex-col h-full">
          <SheetHeader className="px-6 pt-6 pb-4 border-b flex-shrink-0">
            <SheetTitle className="text-2xl font-light">Edit Alert</SheetTitle>
            <SheetDescription className="text-sm font-light">
              Update your alert preferences below.
            </SheetDescription>
          </SheetHeader>

          {editingAlert && (
            <AlertEditForm
              alert={editingAlert}
              onSuccess={(updatedAlert) => {
                setAlerts((prevAlerts) =>
                  prevAlerts.map((alert) =>
                    alert.id === updatedAlert.id ? updatedAlert : alert
                  )
                );
                setEditingAlert(null);
                track("alert_edited");
                setAlertModal({
                  isOpen: true,
                  type: "success",
                  title: "Alert Updated",
                  message: "Your alert has been successfully updated.",
                });
              }}
              onCancel={() => setEditingAlert(null)}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
