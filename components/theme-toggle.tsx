"use client";

import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  return (
    <AnimatedThemeToggler
      className={cn(
        "h-9 w-9",
        // Button variant styles
        "inline-flex items-center justify-center whitespace-nowrap rounded-full text-sm font-medium",
        "ring-offset-background transition-all",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-50",
        // Outline variant with rounded style
        "border border-input bg-background/50 backdrop-blur-sm shadow-md",
        "hover:bg-accent hover:text-accent-foreground hover:shadow-lg",
        // Active/pressed state
        "active:scale-90 active:shadow-inner active:translate-y-0.5",
        "[&>svg]:h-4 [&>svg]:w-4"
      )}
    />
  );
}
