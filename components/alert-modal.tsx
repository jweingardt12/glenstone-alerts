"use client";

import { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

type AlertType = "success" | "error" | "info";

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: AlertType;
  title: string;
  message: string;
  autoDismiss?: boolean;
  autoDismissDelay?: number;
  actionLabel?: string;
  actionUrl?: string;
}

export function AlertModal({
  isOpen,
  onClose,
  type,
  title,
  message,
  autoDismiss = false,
  autoDismissDelay = 3000,
  actionLabel,
  actionUrl,
}: AlertModalProps) {
  useEffect(() => {
    if (isOpen && autoDismiss) {
      const timer = setTimeout(() => {
        onClose();
      }, autoDismissDelay);

      return () => clearTimeout(timer);
    }
  }, [isOpen, autoDismiss, autoDismissDelay, onClose]);

  const getIcon = () => {
    switch (type) {
      case "success":
        return <CheckCircle2 className="h-12 w-12 text-foreground" />;
      case "error":
        return <XCircle className="h-12 w-12 text-foreground" />;
      case "info":
        return <AlertCircle className="h-12 w-12 text-foreground" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <div className="flex flex-col items-center text-center space-y-4 py-4">
          {getIcon()}
          <DialogHeader className="space-y-3">
            <DialogTitle className="text-2xl font-light tracking-wide">
              {title}
            </DialogTitle>
            <DialogDescription className="text-base leading-relaxed">
              {message}
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 mt-4">
            {actionUrl && actionLabel && (
              <Button
                onClick={() => {
                  window.location.href = actionUrl;
                }}
                className="flex-1"
              >
                {actionLabel}
              </Button>
            )}
            <Button
              onClick={onClose}
              variant="outline"
              className={actionUrl ? "flex-1" : ""}
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
