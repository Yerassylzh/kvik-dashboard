"use client";

import React, { forwardRef } from "react";
import clsx from "clsx";

export type ButtonVariant =
  | "primary"
  | "default"
  | "secondary"
  | "outline"
  | "ghost"
  | "destructive"
  | "success";

export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm focus:ring-primary/20",
  default:
    "bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm focus:ring-primary/20",
  secondary:
    "bg-secondary hover:bg-secondary/80 text-secondary-foreground border border-border focus:ring-secondary/20",
  outline:
    "bg-transparent hover:bg-muted text-foreground border border-border hover:border-primary/40 focus:ring-primary/20",
  ghost:
    "bg-transparent hover:bg-muted text-muted-foreground hover:text-foreground focus:ring-primary/20",
  destructive:
    "bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-sm focus:ring-destructive/20",
  success:
    "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm focus:ring-emerald-500/20",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs rounded-lg gap-1.5",
  md: "px-4 py-2.5 text-xs sm:text-sm rounded-xl gap-2",
  lg: "px-6 py-3.5 text-sm sm:text-base rounded-xl gap-2.5",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = "primary",
      size = "md",
      loading = false,
      leftIcon,
      rightIcon,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={clsx(
          "inline-flex items-center justify-center font-semibold transition-all cursor-pointer select-none whitespace-nowrap shrink-0",
          "focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed",
          "[&>svg]:shrink-0",
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {loading && (
          <span className="h-3.5 w-3.5 border-2 border-current/30 border-t-current rounded-full animate-spin shrink-0" />
        )}
        {!loading && leftIcon && (
          <span className="shrink-0 inline-flex items-center">{leftIcon}</span>
        )}
        {children}
        {!loading && rightIcon && (
          <span className="shrink-0 inline-flex items-center">{rightIcon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
