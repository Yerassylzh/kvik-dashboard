"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { OnboardingStepState } from "@/types/niche";
import { FadeIn } from "@/components/ui/motion/FadeIn";

export const STEP_META: Record<
  OnboardingStepState,
  { index: number; titleKey: string; subtitleKey: string }
> = {
  SELECT_NICHE: {
    index: 0,
    titleKey: "stepper.select_niche_title",
    subtitleKey: "stepper.select_niche_subtitle",
  },
  BUSINESS_PROFILE: {
    index: 1,
    titleKey: "stepper.business_profile_title",
    subtitleKey: "stepper.business_profile_subtitle",
  },
  DATA_SOURCE: {
    index: 2,
    titleKey: "stepper.data_source_title",
    subtitleKey: "stepper.data_source_subtitle",
  },
  DATA_PREVIEW: {
    index: 3,
    titleKey: "stepper.data_preview_title",
    subtitleKey: "stepper.data_preview_subtitle",
  },
  CONNECT_CHANNEL: {
    index: 4,
    titleKey: "stepper.channel_title",
    subtitleKey: "stepper.channel_subtitle",
  },
  QUALIFICATION: {
    index: 5,
    titleKey: "stepper.qualification_title",
    subtitleKey: "stepper.qualification_subtitle",
  },
  DONE: {
    index: 6,
    titleKey: "stepper.done_title",
    subtitleKey: "stepper.done_subtitle",
  },
  // COMPLETE_TEST is handled transparently (auto-completes) — not shown as a step
  COMPLETE_TEST: {
    index: 5,
    titleKey: "stepper.qualification_title",
    subtitleKey: "stepper.qualification_subtitle",
  },
};

export const TOTAL_STEPS = 6;

interface OnboardingHeaderProps {
  currentStep: OnboardingStepState;
  error?: string | null;
}

export function OnboardingHeader({
  currentStep,
  error,
}: OnboardingHeaderProps) {
  const t = useTranslations("onboarding");

  const currentMeta = STEP_META[currentStep] || STEP_META.SELECT_NICHE;
  const currentStepIdx = currentMeta.index;
  const progressPercent = Math.min(
    100,
    Math.round(((currentStepIdx + 1) / TOTAL_STEPS) * 100),
  );

  return (
    <>
      {/* Progress Bar Header */}
      <FadeIn delay={0.05} className="w-full mb-8">
        <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground mb-2">
          <span>
            {t("stepper.step_of", {
              current: currentStepIdx + 1,
              total: TOTAL_STEPS,
            })}
          </span>
          <span className="text-accent-brand font-bold">
            {t("stepper.completed", { percent: progressPercent })}
          </span>
        </div>
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden border border-border">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400 transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </FadeIn>

      {/* Step Title & Subtitle */}
      <FadeIn delay={0.1} className="text-center mb-8 max-w-xl px-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
          {t(currentMeta.titleKey as any)}
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-2 leading-relaxed">
          {t(currentMeta.subtitleKey as any)}
        </p>
      </FadeIn>

      {/* Error Alert */}
      {error && (
        <FadeIn className="w-full max-w-2xl mb-6 p-4 rounded-xl alert-destructive border text-xs sm:text-sm font-medium flex items-start gap-3 shadow-sm">
          <span className="text-lg">⚠️</span>
          <span>{error}</span>
        </FadeIn>
      )}
    </>
  );
}
