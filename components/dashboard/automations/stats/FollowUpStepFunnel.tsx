"use client";

import React from "react";
import { ArrowRight, CheckCircle2, CalendarCheck, MessageSquare } from "lucide-react";
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

  return (
    <SectionCard
      title={t("automations.stats_step_funnel")}
      description={t("automations.stats_funnel_desc")}
    >
      <div className="space-y-4">
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
                className="p-4 rounded-xl border border-border/70 bg-card space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="h-6 w-6 rounded-md bg-primary/10 text-primary flex items-center justify-center text-xs font-bold tabular-nums">
                      {step.stepIndex}
                    </span>
                    <span className="text-xs font-semibold text-foreground">
                      {step.name || t("automations.logs_step_prefix", { step: step.stepIndex })}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-medium">
                    <span className="text-muted-foreground">
                      {t("automations.stats_dispatched_label")}{" "}
                      <strong className="text-foreground tabular-nums">
                        {step.dispatched}
                      </strong>
                    </span>
                    <span className="text-muted-foreground">
                      {t("automations.stats_replied_label")}{" "}
                      <strong className="text-foreground tabular-nums">
                        {step.replied} ({replyRate}%)
                      </strong>
                    </span>
                    <span className="text-emerald-600 font-semibold flex items-center gap-1">
                      <CalendarCheck className="w-3.5 h-3.5" />
                      {t("automations.stats_bookings_suffix", {
                        count: step.bookingsCreated,
                        rate: bookingsRate,
                      })}
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-muted/60 h-2 rounded-full overflow-hidden flex">
                  <div
                    style={{ width: `${Math.min(100, replyRate)}%` }}
                    className="bg-primary h-full rounded-full transition-all duration-500"
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
