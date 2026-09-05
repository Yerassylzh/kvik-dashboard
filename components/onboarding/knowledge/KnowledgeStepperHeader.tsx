"use client";

import React from "react";
import { useTranslations } from "next-intl";

export interface StageMeta {
  id: number;
  icon: string;
  translationKey: string;
}

export const KNOWLEDGE_STAGES: StageMeta[] = [
  { id: 0, icon: "📍", translationKey: "knowledge.stages.twogis" },
  { id: 1, icon: "🌐", translationKey: "knowledge.stages.website" },
  { id: 2, icon: "📄", translationKey: "knowledge.stages.documents" },
  { id: 3, icon: "📝", translationKey: "knowledge.stages.notes" },
  { id: 4, icon: "🎯", translationKey: "knowledge.stages.conclusion" },
];

interface KnowledgeStepperHeaderProps {
  currentStage: number;
  onSelectStage: (stage: number) => void;
  completedStages: number[];
}

export function KnowledgeStepperHeader({
  currentStage,
  onSelectStage,
  completedStages,
}: KnowledgeStepperHeaderProps) {
  const t = useTranslations("onboarding");

  return (
    <div className="w-full pb-4 border-b border-border/70 mb-6">
      <div className="flex items-center justify-between gap-1.5 sm:gap-2 overflow-x-auto themed-scroll py-1">
        {KNOWLEDGE_STAGES.map((stage, index) => {
          const isActive = currentStage === stage.id;
          const isCompleted = completedStages.includes(stage.id);
          const label = t(stage.translationKey as any);

          return (
            <button
              key={stage.id}
              type="button"
              onClick={() => onSelectStage(stage.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer select-none ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : isCompleted
                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20"
                    : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <span>{isCompleted && !isActive ? "✓" : stage.icon}</span>
              <span>
                {index + 1}. {label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
