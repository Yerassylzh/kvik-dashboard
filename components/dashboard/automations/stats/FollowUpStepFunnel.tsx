"use client";

import React from "react";
import { CalendarCheck, MessageSquare, Send } from "lucide-react";
import { useTranslations } from "next-intl";
import { SectionCard } from "@/components/dashboard/shared/SectionCard";
import type { StepStatItem } from "@/lib/api/followUps";

interface FollowUpStepFunnelProps {
  stepBreakdown?: StepStatItem[];
}

export function FollowUpStepFunnel({
  stepBreakdown = [],
}: FollowUpStepFunnelProps) {
  const t = useTranslations("dashboard");

  const getStepTitle = (step: StepStatItem) => {
    if (step.stepIndex === 1) return t("automations.step_name_1");
    if (step.stepIndex === 2) return t("automations.step_name_2");
    if (step.stepIndex === 3) return t("automations.step_name_3");
    
    // Normalize any English strings like "Step 1 (+2h)"
    if (step.name && step.name.toLowerCase().startsWith("step 1")) return t("automations.step_name_1");
    if (step.name && step.name.toLowerCase().startsWith("step 2")) return t("automations.step_name_2");
    if (step.name && step.name.toLowerCase().startsWith("step 3")) return t("automations.step_name_3");

    return step.name || t("automations.logs_step_prefix", { step: step.stepIndex });
  };

  return (
    <SectionCard
      title={t("automations.stats_step_funnel")}
      description={t("automations.stats_funnel_desc")}
    >
      <div className="space-y-3">
        {stepBreakdown.length === 0 ? (
          <div className="text-center py-8 text-xs text-muted-foreground">
            {t("automations.stats_funnel_empty")}
          </div>
        ) : (
          stepBreakdown.map((step) => {
            const replyRate = step.replyRate ?? 0;
            const bookingsRate =
              step.dispatched > 0
                ? ((step.bookingsCreated / step.dispatched) * 100).toFixed(1)
                : "0.0";

            return (
              <div
                key={step.stepIndex}
                className="p-3.5 rounded-xl border border-border/70 bg-card hover:border-border transition-colors space-y-2.5"
              >
                {/* Header line */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[11px] font-bold tabular-nums shrink-0">
                      {step.stepIndex}
                    </span>
                    <span className="text-xs font-semibold text-foreground">
                      {getStepTitle(step)}
                    </span>
                  </div>

                  {/* Quantitative Metrics in clean tabular-nums */}
                  <div className="flex items-center gap-4 text-xs tabular-nums">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Send className="w-3 h-3 text-muted-foreground/70" />
                      {t("automations.stats_col_dispatched")}:{" "}
                      <strong className="text-foreground font-semibold">
                        {step.dispatched}
                      </strong>
                    </span>

                    <span className="text-muted-foreground flex items-center gap-1">
                      <MessageSquare className="w-3 h-3 text-muted-foreground/70" />
                      {t("automations.stats_col_replied")}:{" "}
                      <strong className="text-foreground font-semibold">
                        {step.replied} ({replyRate}%)
                      </strong>
                    </span>

                    <span className="text-emerald-600 font-semibold flex items-center gap-1">
                      <CalendarCheck className="w-3.5 h-3.5 text-emerald-600" />
                      {t("automations.stats_col_bookings")}:{" "}
                      <span>
                        {step.bookingsCreated} ({bookingsRate}%)
                      </span>
                    </span>
                  </div>
                </div>

                {/* Modern subtle reply rate bar */}
                <div className="w-full bg-muted/60 h-1.5 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${Math.min(100, replyRate)}%` }}
                    className="bg-primary h-full rounded-full transition-all duration-300"
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </SectionCard>
  );
}
