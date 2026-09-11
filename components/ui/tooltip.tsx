"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import clsx from "clsx";

export interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  className?: string;
}

const sideStyles = {
  top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
  bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
  left: "right-full top-1/2 -translate-y-1/2 mr-2",
  right: "left-full top-1/2 -translate-y-1/2 ml-2",
};

const arrowStyles = {
  top: "top-full left-1/2 -translate-x-1/2 border-t-[6px] border-t-foreground/90 border-x-[5px] border-x-transparent border-b-0",
  bottom: "bottom-full left-1/2 -translate-x-1/2 border-b-[6px] border-b-foreground/90 border-x-[5px] border-x-transparent border-t-0",
  left: "left-full top-1/2 -translate-y-1/2 border-l-[6px] border-l-foreground/90 border-y-[5px] border-y-transparent border-r-0",
  right: "right-full top-1/2 -translate-y-1/2 border-r-[6px] border-r-foreground/90 border-y-[5px] border-y-transparent border-l-0",
};

export function Tooltip({
  content,
  children,
  side = "top",
  className,
}: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const show = () => {
    timer.current = setTimeout(() => setVisible(true), 300);
  };

  const hide = () => {
    clearTimeout(timer.current);
    setVisible(false);
  };

  // Cleanup on unmount
  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <div
      className={clsx("relative inline-flex items-center", className)}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.12, ease: "easeOut" }}
            className={clsx(
              "absolute z-50 pointer-events-none whitespace-nowrap",
              sideStyles[side]
            )}
          >
            <div className="relative bg-foreground/90 text-background text-[11px] font-medium px-2.5 py-1.5 rounded-lg shadow-lg backdrop-blur-sm">
              {content}
              <span className={clsx("absolute w-0 h-0 border-solid", arrowStyles[side])} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
