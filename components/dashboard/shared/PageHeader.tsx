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
    <FadeIn direction="up" distance={8}>
      <div
        className={clsx(
          "pb-3.5 border-b border-border/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3",
          className
        )}
      >
        <div className="min-w-0 space-y-0.5">
          <h1 className="text-lg sm:text-xl font-bold text-foreground tracking-tight">{title}</h1>
          {description && (
            <p className="text-xs text-muted-foreground leading-normal">{description}</p>
          )}
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
    </FadeIn>
  );
}
