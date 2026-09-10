"use client";

import React, { forwardRef, useId } from "react";
import clsx from "clsx";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string | null;
  helperText?: string;
  requiredIndicator?: boolean;
  leftAddon?: React.ReactNode;
  rightAddon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      requiredIndicator,
      leftAddon,
      rightAddon,
      className,
      id: customId,
      required,
      disabled,
      ...props
    },
    ref
  ) => {
    const defaultId = useId();
    const inputId = customId || defaultId;
    const isRequired = required || requiredIndicator;

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold text-muted-foreground"
          >
            {label}
            {isRequired && <span className="text-destructive ml-1">*</span>}
          </label>
        )}

        <div className="relative flex items-center">
          {leftAddon && (
            <div className="absolute left-3.5 flex items-center pointer-events-none text-muted-foreground text-sm">
              {leftAddon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            required={isRequired}
            disabled={disabled}
            className={clsx(
              "w-full px-4 py-2.5 bg-background border rounded-xl text-foreground placeholder:text-muted-foreground",
              "focus:outline-none focus:ring-2 transition-all text-xs sm:text-sm",
              leftAddon && "pl-10",
              rightAddon && "pr-10",
              error
                ? "border-destructive focus:border-destructive focus:ring-destructive/20"
                : "border-border focus:border-primary focus:ring-primary/20",
              disabled && "opacity-60 cursor-not-allowed bg-muted/40",
              className
            )}
            {...props}
          />

          {rightAddon && (
            <div className="absolute right-3.5 flex items-center">
              {rightAddon}
            </div>
          )}
        </div>

        {error && (
          <p className="text-[11px] text-destructive font-medium flex items-center gap-1">
            <span>⚠️</span>
            <span>{error}</span>
          </p>
        )}

        {helperText && !error && (
          <p className="text-[11px] text-muted-foreground">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
