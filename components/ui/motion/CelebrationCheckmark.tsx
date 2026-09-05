"use client";

import React from "react";
import { motion } from "motion/react";

interface CelebrationCheckmarkProps {
  size?: number;
  className?: string;
}

export function CelebrationCheckmark({
  size = 64,
  className,
}: CelebrationCheckmarkProps) {
  return (
    <div
      className={`relative flex items-center justify-center ${className || ""}`}
    >
      {/* Outer pulsing ring */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [1, 1.3, 1.1], opacity: [0.6, 0.2, 0] }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        style={{ width: size * 1.5, height: size * 1.5 }}
        className="absolute rounded-full bg-emerald-500/30"
      />

      {/* Circle container */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 350, damping: 20 }}
        style={{ width: size, height: size }}
        className="rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/25"
      >
        <svg
          width={size * 0.55}
          height={size * 0.55}
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <motion.path
            d="M5 13l4 4L19 7"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
          />
        </svg>
      </motion.div>
    </div>
  );
}
