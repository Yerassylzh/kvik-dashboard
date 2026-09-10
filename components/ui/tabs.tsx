"use client";

import React from "react";
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
  return (
    <div
      className={clsx(
        "flex items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
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
              "text-xs px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1.5 flex-shrink-0 select-none",
              isActive
                ? "bg-card text-foreground font-semibold shadow-xs border border-border"
                : "text-muted-foreground hover:text-foreground hover:bg-card/40"
            )}
          >
            {tab.icon && <span className="text-sm shrink-0">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={clsx(
                  "text-[10px] px-1.5 py-0.2 rounded-full font-semibold",
                  isActive
                    ? "bg-primary text-primary-foreground"
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
