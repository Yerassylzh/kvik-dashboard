"use client";

import React from "react";
import clsx from "clsx";

export interface ProgressProps {
  value: number; // 0–100
  max?: number;
  label?: string;
  showValue?: boolean;
  size?: "xs" | "sm" | "md";
  variant?: "default" | "brand" | "success" | "warning" | "destructive";
  className?: string;
}

const sizeHeights = { xs: "h-1", sm: "h-1.5", md: "h-2.5" };

const variantFills: Record<string, string> = {
  default: "bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400",
  brand: "bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400",
  success: "bg-gradient-to-r from-emerald-500 to-teal-400",
  warning: "bg-gradient-to-r from-amber-500 to-orange-400",
  destructive: "bg-gradient-to-r from-rose-500 to-pink-400",
};

export function Progress({
  value,
  max = 100,
  label,
  showValue = false,
  size = "sm",
  variant = "brand",
  className,
}: ProgressProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={clsx("w-full", className)}>
      {(label || showValue) && (
        <div className="flex items-center justify-between mb-1.5">
          {label && <span className="text-xs text-muted-foreground font-medium">{label}</span>}
          {showValue && (
            <span className="text-xs font-bold text-foreground tabular-nums">
              {value}
              {max !== 100 ? `/${max}` : "%"}
            </span>
          )}
        </div>
      )}
      <div className={clsx("w-full bg-muted rounded-full overflow-hidden", sizeHeights[size])}>
        <div
          className={clsx("h-full rounded-full transition-all duration-500", variantFills[variant])}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
