"use client";

import React from "react";
import clsx from "clsx";
import { FadeIn } from "@/components/ui/motion/FadeIn";

export interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, description, action, className }: PageHeaderProps) {
  return (
    <FadeIn direction="up" distance={12}>
      <div
        className={clsx(
          "pb-5 border-b border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4",
          className
        )}
      >
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">{title}</h1>
          {description && (
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          )}
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
    </FadeIn>
  );
}
