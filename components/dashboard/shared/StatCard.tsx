"use client";

import React from "react";
import clsx from "clsx";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { InteractiveCard } from "@/components/ui/motion/InteractiveCard";

export interface StatCardProps {
  label: string;
  value: string | number;
  /** Optional delta percentage — positive = up, negative = down, 0 = neutral */
  delta?: number;
  /** Optional sub-label below value */
  sublabel?: string;
  icon?: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function StatCard({
  label,
  value,
  delta,
  sublabel,
  icon,
  className,
  onClick,
}: StatCardProps) {
  const deltaIsPositive = delta !== undefined && delta > 0;
  const deltaIsNegative = delta !== undefined && delta < 0;

  const DeltaIcon =
    delta === undefined
      ? null
      : deltaIsPositive
      ? TrendingUp
      : deltaIsNegative
      ? TrendingDown
      : Minus;

  return (
    <InteractiveCard
      onClick={onClick}
      className={clsx(
        "p-5 rounded-2xl border border-border bg-card shadow-sm select-none",
        onClick && "cursor-pointer",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        {icon && (
          <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary flex-shrink-0">
            {icon}
          </div>
        )}
        {delta !== undefined && DeltaIcon && (
          <span
            className={clsx(
              "inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full",
              deltaIsPositive && "text-emerald-600 bg-emerald-500/10",
              deltaIsNegative && "text-rose-600 bg-rose-500/10",
              !deltaIsPositive && !deltaIsNegative && "text-muted-foreground bg-muted"
            )}
          >
            <DeltaIcon className="h-3 w-3" />
            {Math.abs(delta)}%
          </span>
        )}
      </div>

      <p className="text-2xl font-extrabold text-foreground tracking-tight tabular-nums">
        {value}
      </p>
      <p className="text-xs font-semibold text-muted-foreground mt-1">{label}</p>
      {sublabel && (
        <p className="text-[10px] text-muted-foreground/70 mt-0.5">{sublabel}</p>
      )}
    </InteractiveCard>
  );
}
