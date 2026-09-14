"use client";

import React, { useId } from "react";
import { motion } from "motion/react";
import clsx from "clsx";

export interface TabItem<T extends string | number = string> {
  id: T;
  label: string;
  icon?: React.ReactNode;
  count?: number;
}

export interface SegmentedTabsProps<T extends string | number = string> {
  tabs: TabItem<T>[];
  activeTab: T;
  onChange: (tabId: T) => void;
  className?: string;
}

export function SegmentedTabs<T extends string | number = string>({
  tabs,
  activeTab,
  onChange,
  className,
}: SegmentedTabsProps<T>) {
  // Unique layoutId per instance so multiple SegmentedTabs on the same page
  // don't share the same shared-layout animation group.
  const pillId = useId();

  return (
    <div
      className={clsx(
        "flex items-center gap-0.5 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
        "p-1 rounded-xl bg-muted/40 border border-border/70 w-full sm:w-fit",
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={String(tab.id)}
            type="button"
            onClick={() => onChange(tab.id)}
            className={clsx(
              // Fixed height + padding — never changes regardless of active state
              "relative text-xs px-2.5 py-1 rounded-lg font-medium transition-colors duration-150",
              "cursor-pointer flex items-center gap-1.5 flex-shrink-0 select-none z-10",
              isActive
                ? "text-foreground font-semibold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {/* Sliding pill sits behind text via absolute positioning */}
            {isActive && (
              <motion.span
                layoutId={pillId}
                className="absolute inset-0 rounded-lg bg-card shadow-xs"
                style={{ zIndex: -1 }}
                transition={{
                  type: "spring",
                  stiffness: 350,
                  damping: 25,
                }}
              />
            )}

            {tab.icon && (
              <span className="text-sm shrink-0">{tab.icon}</span>
            )}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={clsx(
                  "text-[10px] px-1.5 py-0.5 rounded-full font-semibold transition-colors duration-150",
                  isActive
                    ? "bg-primary/15 text-primary"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
