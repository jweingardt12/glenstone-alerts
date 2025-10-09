"use client";

import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";

export function ThemeToggle() {
  return (
    <AnimatedThemeToggler className="h-9 w-9 rounded-md inline-flex items-center justify-center hover:bg-accent hover:text-accent-foreground transition-colors [&>svg]:h-4 [&>svg]:w-4" />
  );
}
