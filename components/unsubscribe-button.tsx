"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AlertModal } from "@/components/alert-modal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface UnsubscribeButtonProps {
  token: string;
}

export function UnsubscribeButton({ token }: UnsubscribeButtonProps) {
  const [isUnsubscribing, setIsUnsubscribing] = useState(false);
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

  const handleUnsubscribe = async () => {
    try {
      setIsUnsubscribing(true);

      const response = await fetch(`/api/alerts/by-token/${token}`, {
        method: "PATCH",
      });

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error("Failed to parse response:", parseError);
        throw new Error("Invalid response from server");
      }

      console.log("Unsubscribe response:", { status: response.status, data });

      if (!response.ok) {
        throw new Error(data.error || `Failed to unsubscribe (status: ${response.status})`);
      }

      setAlertModal({
        isOpen: true,
        type: "success",
        title: "Unsubscribed Successfully",
        message: data.message || "All alerts have been deactivated. You will no longer receive email notifications.",
      });

      // Refresh the page after showing the success message
      setTimeout(() => {
        // Use router refresh to avoid cache issues
        window.location.href = window.location.href;
      }, 1500);
    } catch (error) {
      console.error("Error unsubscribing:", error);
      setAlertModal({
        isOpen: true,
        type: "error",
        title: "Failed to Unsubscribe",
        message: error instanceof Error ? error.message : "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsUnsubscribing(false);
    }
  };

  return (
    <>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" size="sm">
            Unsubscribe from All
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsubscribe from All Alerts?</AlertDialogTitle>
            <AlertDialogDescription>
              This will deactivate all of your alerts and stop all email notifications.
              You can reactivate individual alerts later if needed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUnsubscribe}
              disabled={isUnsubscribing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isUnsubscribing ? "Unsubscribing..." : "Unsubscribe"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
