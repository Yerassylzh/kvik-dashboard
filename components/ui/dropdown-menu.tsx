"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import clsx from "clsx";

export interface DropdownMenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  variant?: "default" | "destructive";
  disabled?: boolean;
  onClick: () => void;
}

export interface DropdownMenuProps {
  trigger: React.ReactNode;
  items: DropdownMenuItem[];
  align?: "left" | "right";
  className?: string;
}

export function DropdownMenu({
  trigger,
  items,
  align = "right",
  className,
}: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  return (
    <div ref={ref} className={clsx("relative inline-block", className)}>
      <div onClick={() => setOpen((v) => !v)}>{trigger}</div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className={clsx(
              "absolute top-full mt-1.5 z-50 min-w-[160px] rounded-xl bg-card border border-border shadow-xl py-1 overflow-hidden",
              align === "right" ? "right-0" : "left-0"
            )}
          >
            {items.map((item) => (
              <button
                key={item.id}
                disabled={item.disabled}
                onClick={() => {
                  if (!item.disabled) {
                    item.onClick();
                    setOpen(false);
                  }
                }}
                className={clsx(
                  "w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium transition-colors text-left",
                  item.disabled && "opacity-40 cursor-not-allowed",
                  !item.disabled && item.variant === "destructive"
                    ? "text-destructive hover:bg-destructive/10"
                    : !item.disabled
                    ? "text-foreground hover:bg-muted"
                    : ""
                )}
              >
                {item.icon && (
                  <span className="h-3.5 w-3.5 shrink-0 flex items-center justify-center">
                    {item.icon}
                  </span>
                )}
                <span>{item.label}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
