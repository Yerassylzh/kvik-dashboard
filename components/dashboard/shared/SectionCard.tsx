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
        "rounded-2xl border border-border bg-card shadow-sm overflow-hidden",
        className
      )}
    >
      {(title || description || action) && (
        <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-border">
          <div className="min-w-0">
            {title && (
              <h2 className="text-sm font-bold text-foreground tracking-tight">{title}</h2>
            )}
            {description && (
              <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
            )}
          </div>
          {action && <div className="flex-shrink-0">{action}</div>}
        </div>
      )}
      <div className={clsx(!noPadding && "p-5", bodyClassName)}>{children}</div>
    </div>
  );
}
