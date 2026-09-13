"use client";

import { useState, useEffect, useCallback } from "react";

const DEV_MODE_KEY = "kvik_dev_mode";
const DEV_MODE_EVENT = "kvik:dev-mode-changed";

/** Returns true only when running in development (process.env.NODE_ENV === "development"). */
export function isDevEnvironment(): boolean {
  return process.env.NODE_ENV === "development";
}

/**
 * Hook to read/write the developer-mode flag from localStorage.
 * Reactively syncs across all mounted components using a custom broadcast event,
 * so toggling in Settings immediately updates the sidebar (no page refresh needed).
 */
export function useDevMode() {
  const [isDevMode, setIsDevMode] = useState(false);

  // Read initial value and subscribe to changes
  useEffect(() => {
    if (!isDevEnvironment()) return;

    // Read current value
    setIsDevMode(localStorage.getItem(DEV_MODE_KEY) === "true");

    // Listen for changes triggered by OTHER components (same tab via custom event)
    const handleCustom = (e: CustomEvent<boolean>) => {
      setIsDevMode(e.detail);
    };

    // Listen for changes from OTHER tabs (native storage event)
    const handleStorage = (e: StorageEvent) => {
      if (e.key === DEV_MODE_KEY) {
        setIsDevMode(e.newValue === "true");
      }
    };

    window.addEventListener(DEV_MODE_EVENT as any, handleCustom as EventListener);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(DEV_MODE_EVENT as any, handleCustom as EventListener);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const toggle = useCallback(() => {
    if (!isDevEnvironment()) return;
    setIsDevMode((prev) => {
      const next = !prev;
      if (next) {
        localStorage.setItem(DEV_MODE_KEY, "true");
      } else {
        localStorage.removeItem(DEV_MODE_KEY);
      }
      // Broadcast asynchronously to all other useDevMode instances in the same tab
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent(DEV_MODE_EVENT, { detail: next }));
      }, 0);
      return next;
    });
  }, []);

  return { isDevMode: isDevEnvironment() && isDevMode, toggle };
}

