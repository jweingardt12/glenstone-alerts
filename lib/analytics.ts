/**
 * Safe analytics wrapper for OpenPanel
 * Prevents crashes when analytics isn't properly configured
 */

import { useCallback } from "react";
import { useOpenPanel } from "@openpanel/nextjs";

type TrackFunction = (name: string, properties?: Record<string, unknown>) => void;

/**
 * Hook that provides a safe track function that won't crash if OpenPanel isn't configured
 */
export function useSafeTrack(): TrackFunction {
  const { track } = useOpenPanel();

  return useCallback((name: string, properties?: Record<string, unknown>) => {
    try {
      if (track && typeof track === 'function') {
        track(name, properties);
      }
    } catch (error) {
      // Silently ignore analytics errors in development
      if (process.env.NODE_ENV === 'development') {
        console.debug('[Analytics] Track failed:', name, error);
      }
    }
  }, [track]);
}
