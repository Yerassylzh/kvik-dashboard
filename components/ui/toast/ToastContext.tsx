"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { AnimatePresence, motion } from "motion/react";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastOptions {
  id?: string;
  title?: string;
  message: string;
  type?: ToastType;
  durationMs?: number;
}

interface ToastItem extends ToastOptions {
  id: string;
  createdAt: number;
}

interface ToastContextValue {
  showToast: (options: ToastOptions) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const ICONS: Record<ToastType, string> = {
  success: "✓",
  error: "✕",
  warning: "⚠️",
  info: "ℹ️",
};

const STYLES: Record<
  ToastType,
  { bg: string; border: string; iconBg: string; iconText: string }
> = {
  success: {
    bg: "bg-card",
    border: "border-emerald-500/30",
    iconBg: "bg-emerald-500/15",
    iconText: "text-emerald-600 dark:text-emerald-400 font-bold",
  },
  error: {
    bg: "bg-card",
    border: "border-destructive/30",
    iconBg: "bg-destructive/15",
    iconText: "text-destructive font-bold",
  },
  warning: {
    bg: "bg-card",
    border: "border-amber-500/30",
    iconBg: "bg-amber-500/15",
    iconText: "text-amber-600 dark:text-amber-400 font-bold",
  },
  info: {
    bg: "bg-card",
    border: "border-indigo-500/30",
    iconBg: "bg-indigo-500/15",
    iconText: "text-indigo-600 dark:text-indigo-400 font-bold",
  },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (options: ToastOptions) => {
      const id = options.id || Math.random().toString(36).substring(2, 9);
      const durationMs = options.durationMs ?? 4000;
      const newToast: ToastItem = {
        ...options,
        id,
        type: options.type || "info",
        createdAt: Date.now(),
      };

      setToasts((prev) => [...prev.filter((t) => t.id !== id), newToast]);

      if (durationMs > 0) {
        setTimeout(() => {
          dismiss(id);
        }, durationMs);
      }
    },
    [dismiss],
  );

  const success = useCallback(
    (message: string, title?: string) => {
      showToast({ message, title, type: "success" });
    },
    [showToast],
  );

  const error = useCallback(
    (message: string, title?: string) => {
      showToast({ message, title, type: "error" });
    },
    [showToast],
  );

  const info = useCallback(
    (message: string, title?: string) => {
      showToast({ message, title, type: "info" });
    },
    [showToast],
  );

  const warning = useCallback(
    (message: string, title?: string) => {
      showToast({ message, title, type: "warning" });
    },
    [showToast],
  );

  return (
    <ToastContext.Provider
      value={{ showToast, success, error, info, warning, dismiss }}
    >
      {children}

      {/* Floating Animated Toast Container */}
      <div
        aria-live="polite"
        className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-3 sm:px-0"
      >
        <AnimatePresence mode="sync">
          {toasts.map((toast) => {
            const toastType = toast.type || "info";
            const style = STYLES[toastType];

            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: -16, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.9 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className={`pointer-events-auto p-3.5 rounded-2xl ${style.bg} border ${style.border} shadow-xl backdrop-blur-xl flex items-start gap-3 select-none`}
              >
                <div
                  className={`h-7 w-7 rounded-xl ${style.iconBg} ${style.iconText} flex items-center justify-center text-xs flex-shrink-0 mt-0.5`}
                >
                  {ICONS[toastType]}
                </div>

                <div className="min-w-0 flex-1 pr-1">
                  {toast.title && (
                    <h5 className="font-bold text-xs text-foreground mb-0.5">
                      {toast.title}
                    </h5>
                  )}
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {toast.message}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => dismiss(toast.id)}
                  className="text-muted-foreground hover:text-foreground text-xs font-bold p-1 rounded-lg transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return ctx;
}
