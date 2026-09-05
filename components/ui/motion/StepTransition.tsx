"use client";

import React from "react";
import { motion, AnimatePresence } from "motion/react";

interface StepTransitionProps {
  stepKey: string | number;
  direction?: number; // 1 for forward, -1 for backward
  children: React.ReactNode;
  className?: string;
}

const variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 40 : -40,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -40 : 40,
    opacity: 0,
  }),
};

/**
 * StepTransition handles smooth directional slide and fade animations between steps.
 */
export function StepTransition({
  stepKey,
  direction = 1,
  children,
  className,
}: StepTransitionProps) {
  return (
    <AnimatePresence mode="wait" custom={direction}>
      <motion.div
        key={stepKey}
        custom={direction}
        variants={variants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={{
          x: { type: "spring", stiffness: 320, damping: 30 },
          opacity: { duration: 0.2 },
        }}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
