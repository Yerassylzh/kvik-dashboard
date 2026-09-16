"use client";

import React from "react";
import clsx from "clsx";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { InteractiveCard } from "@/components/ui/motion/InteractiveCard";
import { Skeleton } from "@/components/ui/skeleton";

export interface StatCardProps {
  label: string;
  value: string | number;
  isLoading?: boolean;
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
  isLoading = false,
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
        "p-4 sm:p-5 rounded-xl border border-border/80 bg-card select-none transition-all hover:border-border",
        onClick && "cursor-pointer hover:border-primary/40",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3 mb-2.5">
        {icon && (
          <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary border border-primary/20 flex items-center justify-center flex-shrink-0">
            {icon}
          </div>
        )}
        {isLoading ? (
          <Skeleton className="h-4 w-12 rounded-full" />
        ) : delta !== undefined && DeltaIcon ? (
          <span
            className={clsx(
              "inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ml-auto",
              deltaIsPositive && "text-emerald-700 bg-emerald-50 border border-emerald-200/60",
              deltaIsNegative && "text-rose-700 bg-rose-50 border border-rose-200/60",
              !deltaIsPositive && !deltaIsNegative && "text-muted-foreground bg-muted border border-border/60"
            )}
          >
            <DeltaIcon className="h-3 w-3" />
            {Math.abs(delta)}%
          </span>
        ) : null}
      </div>

      {isLoading ? (
        <div className="my-1">
          <Skeleton className="h-7 w-20 rounded-md" />
        </div>
      ) : (
        <p className="text-2xl sm:text-[26px] font-bold text-foreground tracking-tight tabular-nums leading-tight">
          {value}
        </p>
      )}

      <p className="text-xs font-medium text-muted-foreground mt-1">{label}</p>
      {sublabel && (
        <p className="text-[10px] text-muted-foreground/80 mt-0.5">{sublabel}</p>
      )}
    </InteractiveCard>
  );
}
