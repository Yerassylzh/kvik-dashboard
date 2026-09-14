"use client";

import React from "react";
import clsx from "clsx";

export type BadgeVariant =
  | "default"
  | "primary"
  | "success"
  | "warning"
  | "destructive"
  | "info"
  | "muted";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  icon?: React.ReactNode;
  pulse?: boolean;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-muted text-muted-foreground border-border",
  primary: "bg-primary/10 text-accent-brand border-primary/20",
  success: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  warning: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
  destructive: "bg-destructive/10 text-destructive border-destructive/20",
  info: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
  muted: "bg-muted/80 text-muted-foreground border-border/80",
};

export function Badge({
  children,
  variant = "default",
  icon,
  pulse = false,
  className,
  ...props
}: BadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold border select-none whitespace-nowrap",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {pulse && (
        <span
          className={clsx(
            "h-1.5 w-1.5 rounded-full animate-pulse",
            variant === "success" && "bg-emerald-500",
            variant === "warning" && "bg-amber-500",
            variant === "destructive" && "bg-destructive",
            variant === "info" && "bg-blue-500",
            variant === "primary" && "bg-accent-brand",
            (variant === "default" || variant === "muted") && "bg-muted-foreground"
          )}
        />
      )}
      {icon && <span className="shrink-0">{icon}</span>}
      <span className="inline-flex items-center gap-1">{children}</span>
    </span>
  );
}
