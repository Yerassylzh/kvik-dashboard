"use client";

import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export interface DashboardTabItem {
  id: string;
  label: string;
  href?: string;
  active?: boolean;
  onClick?: () => void;
  count?: number;
  icon?: React.ComponentType<{ className?: string }>;
}

interface DashboardPageHeaderProps {
  title: string;
  description?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  tabs?: DashboardTabItem[];
  className?: string;
}

export function DashboardPageHeader({
  title,
  description,
  badge,
  actions,
  tabs,
  className,
}: DashboardPageHeaderProps) {
  return (
    <div className={cn("space-y-3.5 pb-0 border-b border-border/70 shrink-0", className)}>
      {/* Top Title & Action Ribbon */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
              {title}
            </h1>
            {badge}
          </div>
          {description && (
            <p className="text-xs text-muted-foreground leading-normal max-w-2xl">
              {description}
            </p>
          )}
        </div>

        {actions && (
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {actions}
          </div>
        )}
      </div>

      {/* Modern Underline / Pill Tabs (MoonAI & Linear Style) */}
      {tabs && tabs.length > 0 && (
        <div className="flex items-center gap-1 overflow-x-auto themed-scroll pt-1 -mb-[1px]">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const content = (
              <div className="flex items-center gap-2">
                {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={cn(
                      "text-[10px] px-1.5 py-0.2 rounded-full font-mono font-semibold",
                      tab.active
                        ? "bg-primary/15 text-primary font-bold"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {tab.count}
                  </span>
                )}
              </div>
            );

            const tabClassName = cn(
              "px-3 py-2 text-xs font-medium whitespace-nowrap transition-all border-b-2 shrink-0 cursor-pointer select-none",
              tab.active
                ? "border-primary text-primary font-semibold"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border/80"
            );

            if (tab.href) {
              return (
                <Link key={tab.id} href={tab.href} className={tabClassName}>
                  {content}
                </Link>
              );
            }

            return (
              <button
                key={tab.id}
                type="button"
                onClick={tab.onClick}
                className={tabClassName}
              >
                {content}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
