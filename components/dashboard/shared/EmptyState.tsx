"use client";

import React from "react";
import clsx from "clsx";
import { FadeIn } from "@/components/ui/motion/FadeIn";
import { Button } from "@/components/ui/button";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <FadeIn direction="up" distance={12}>
      <div
        className={clsx(
          "flex flex-col items-center justify-center text-center py-16 px-8 gap-4",
          className
        )}
      >
        {icon && (
          <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground mb-1">
            {icon}
          </div>
        )}
        <div className="space-y-1.5">
          <p className="text-sm font-bold text-foreground">{title}</p>
          {description && (
            <p className="text-xs text-muted-foreground max-w-xs">{description}</p>
          )}
        </div>
        {actionLabel && onAction && (
          <Button variant="primary" size="sm" onClick={onAction}>
            {actionLabel}
          </Button>
        )}
      </div>
    </FadeIn>
  );
}
