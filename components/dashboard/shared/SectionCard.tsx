"use client";

import React from "react";
import clsx from "clsx";

export interface SectionCardProps {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  noPadding?: boolean;
}

export function SectionCard({
  title,
  description,
  action,
  children,
  className,
  bodyClassName,
  noPadding = false,
}: SectionCardProps) {
  return (
    <div
      className={clsx(
        "rounded-xl border border-border/80 bg-card overflow-hidden",
        className
      )}
    >
      {(title || description || action) && (
        <div className="flex items-start justify-between gap-4 px-4 sm:px-5 py-3.5 border-b border-border/70">
          <div className="min-w-0">
            {title && (
              <h2 className="text-sm font-semibold text-foreground tracking-tight">{title}</h2>
            )}
            {description && (
              <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
            )}
          </div>
          {action && <div className="flex-shrink-0">{action}</div>}
        </div>
      )}
      <div className={clsx(!noPadding && "p-4 sm:p-5", bodyClassName)}>{children}</div>
    </div>
  );
}
