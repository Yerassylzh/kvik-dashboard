"use client";

import React, { forwardRef, useId } from "react";
import clsx from "clsx";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options?: SelectOption[];
  error?: string | null;
  helperText?: string;
  requiredIndicator?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      options,
      error,
      helperText,
      requiredIndicator,
      className,
      children,
      id: customId,
      required,
      disabled,
      ...props
    },
    ref
  ) => {
    const defaultId = useId();
    const selectId = customId || defaultId;
    const isRequired = required || requiredIndicator;

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-xs font-semibold text-muted-foreground"
          >
            {label}
            {isRequired && <span className="text-destructive ml-1">*</span>}
          </label>
        )}

        <select
          ref={ref}
          id={selectId}
          required={isRequired}
          disabled={disabled}
          className={clsx(
            "w-full px-4 py-2.5 bg-background border rounded-xl text-foreground",
            "focus:outline-none focus:ring-2 transition-all text-xs sm:text-sm cursor-pointer",
            error
              ? "border-destructive focus:border-destructive focus:ring-destructive/20"
              : "border-border focus:border-primary focus:ring-primary/20",
            disabled && "opacity-60 cursor-not-allowed bg-muted/40",
            className
          )}
          {...props}
        >
          {options
            ? options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))
            : children}
        </select>

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

Select.displayName = "Select";
