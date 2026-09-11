"use client";

import React from "react";
import clsx from "clsx";

// ─── Base Skeleton ────────────────────────────────────────────────────────────

export interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={clsx(
        "relative overflow-hidden rounded-lg bg-muted",
        "before:absolute before:inset-0 before:-translate-x-full",
        "before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent",
        "before:animate-[shimmer_1.5s_infinite]",
        className
      )}
    />
  );
}

// ─── Named Shapes ────────────────────────────────────────────────────────────

/** Skeleton for a KPI stat card (StatCard) */
export function StatCardSkeleton() {
  return (
    <div className="p-5 rounded-2xl border border-border bg-card space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-8 rounded-xl" />
        <Skeleton className="h-4 w-16 rounded-full" />
      </div>
      <Skeleton className="h-7 w-24 rounded-lg" />
      <Skeleton className="h-3 w-32 rounded-full" />
    </div>
  );
}

/** Skeleton for a single list/table row */
export function ListRowSkeleton({ cols = 4 }: { cols?: number }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-0">
      <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
      <div className="flex-1 flex items-center gap-3">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton
            key={i}
            className={clsx(
              "h-3 rounded-full",
              i === 0 ? "w-28" : i === 1 ? "w-20" : "w-14"
            )}
          />
        ))}
      </div>
    </div>
  );
}

/** Skeleton for a conversation thread item (inbox list) */
export function ThreadSkeleton() {
  return (
    <div className="flex items-start gap-3 px-4 py-3.5 border-b border-border">
      <Skeleton className="h-9 w-9 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="flex items-center justify-between">
          <Skeleton className="h-3 w-24 rounded-full" />
          <Skeleton className="h-3 w-10 rounded-full" />
        </div>
        <Skeleton className="h-3 w-full rounded-full" />
        <Skeleton className="h-3 w-2/3 rounded-full" />
      </div>
    </div>
  );
}

/** Skeleton for a kanban lead card */
export function LeadCardSkeleton() {
  return (
    <div className="p-4 rounded-xl border border-border bg-card space-y-2.5">
      <div className="flex items-center gap-2">
        <Skeleton className="h-7 w-7 rounded-full" />
        <Skeleton className="h-3 w-28 rounded-full" />
      </div>
      <Skeleton className="h-3 w-20 rounded-full" />
      <Skeleton className="h-3 w-full rounded-full" />
    </div>
  );
}
