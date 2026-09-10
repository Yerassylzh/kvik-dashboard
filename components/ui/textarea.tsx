"use client";

import React, { forwardRef, useId } from "react";
import clsx from "clsx";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string | null;
  helperText?: string;
  requiredIndicator?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      error,
      helperText,
      requiredIndicator,
      className,
      id: customId,
      required,
      disabled,
      rows = 3,
      ...props
    },
    ref
  ) => {
    const defaultId = useId();
    const textareaId = customId || defaultId;
    const isRequired = required || requiredIndicator;

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-xs font-semibold text-muted-foreground"
          >
            {label}
            {isRequired && <span className="text-destructive ml-1">*</span>}
          </label>
        )}

        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          required={isRequired}
          disabled={disabled}
          className={clsx(
            "w-full px-4 py-2.5 bg-background border rounded-xl text-foreground placeholder:text-muted-foreground",
            "focus:outline-none focus:ring-2 transition-all text-xs sm:text-sm",
            error
              ? "border-destructive focus:border-destructive focus:ring-destructive/20"
              : "border-border focus:border-primary focus:ring-primary/20",
            disabled && "opacity-60 cursor-not-allowed bg-muted/40",
            className
          )}
          {...props}
        />

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

Textarea.displayName = "Textarea";
