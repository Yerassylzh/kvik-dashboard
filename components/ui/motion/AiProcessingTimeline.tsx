"use client";

import React from "react";
import { motion } from "motion/react";
import { clsx } from "clsx";

export interface TimelineStage {
  id: string;
  label: string;
}

interface AiProcessingTimelineProps {
  stages: TimelineStage[];
  currentStageIndex: number;
  status: "QUEUED" | "PROCESSING" | "DONE" | "FAILED" | "IDLE";
  title?: string;
  subtitle?: string;
  className?: string;
}

export function AiProcessingTimeline({
  stages,
  currentStageIndex,
  status,
  title,
  subtitle,
  className,
}: AiProcessingTimelineProps) {
  return (
    <div
      className={clsx(
        "py-6 px-6 sm:px-8 rounded-2xl bg-card border border-border space-y-5 shadow-sm text-center",
        className,
      )}
    >
      {/* Animated AI Pulse Icon */}
      <div className="flex justify-center">
        <div className="relative flex items-center justify-center">
          <motion.div
            animate={{
              scale: [1, 1.25, 1],
              opacity: [0.3, 0.7, 0.3],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute h-14 w-14 rounded-full bg-primary/20 blur-md"
          />
          <div className="h-12 w-12 rounded-2xl bg-primary/10 border border-primary/20 text-accent-brand flex items-center justify-center text-2xl relative z-10 shadow-sm">
            {status === "DONE" ? "✓" : status === "FAILED" ? "⚠️" : "🤖"}
          </div>
        </div>
      </div>

      {/* Headings */}
      <div className="space-y-1 max-w-md mx-auto">
        <h3 className="font-bold text-sm sm:text-base text-foreground">
          {title || "ИИ структурирует базу знаний..."}
        </h3>
        {subtitle && (
          <p className="text-xs text-muted-foreground leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>

      {/* Timeline Steps */}
      <div className="space-y-2.5 max-w-sm mx-auto text-left pt-1">
        {stages.map((stage, idx) => {
          const isDone = idx < currentStageIndex || status === "DONE";
          const isCurrent =
            idx === currentStageIndex &&
            status !== "DONE" &&
            status !== "FAILED";

          return (
            <div
              key={stage.id}
              className={clsx(
                "flex items-center gap-3 p-2.5 rounded-xl transition-all duration-300",
                isCurrent
                  ? "bg-primary/5 border border-primary/20 shadow-xs"
                  : "opacity-60",
              )}
            >
              <div className="flex-shrink-0 flex items-center justify-center">
                {isDone ? (
                  <div className="h-5 w-5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-center text-[11px] font-bold">
                    ✓
                  </div>
                ) : isCurrent ? (
                  <div className="h-5 w-5 border-2 border-accent-brand border-t-transparent rounded-full animate-spin" />
                ) : (
                  <div className="h-5 w-5 rounded-full bg-muted border border-border flex items-center justify-center text-[10px] text-muted-foreground font-semibold">
                    {idx + 1}
                  </div>
                )}
              </div>

              <span
                className={clsx(
                  "text-xs font-medium truncate",
                  isCurrent
                    ? "text-foreground font-semibold"
                    : "text-muted-foreground",
                )}
              >
                {stage.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
