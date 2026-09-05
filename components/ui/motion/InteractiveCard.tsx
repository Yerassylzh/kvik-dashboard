"use client";

import React from "react";
import { motion, HTMLMotionProps } from "motion/react";
import { clsx } from "clsx";

interface InteractiveCardProps extends Omit<
  HTMLMotionProps<"div">,
  "children"
> {
  selected?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function InteractiveCard({
  selected = false,
  disabled = false,
  children,
  className,
  onClick,
  ...props
}: InteractiveCardProps) {
  return (
    <motion.div
      whileHover={disabled ? undefined : { y: -2, scale: 1.01 }}
      whileTap={disabled ? undefined : { scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      onClick={disabled ? undefined : onClick}
      className={clsx(
        "transition-colors duration-200 cursor-pointer select-none",
        selected && "ring-2 ring-primary border-primary",
        disabled && "opacity-50 cursor-not-allowed",
        className,
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}
