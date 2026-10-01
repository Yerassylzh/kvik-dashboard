"use client";

import React from "react";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import { SectionCard } from "@/components/dashboard/shared/SectionCard";
import { Skeleton } from "@/components/ui/skeleton";
import type { AnalyticsFunnelResponse, FunnelStageItem } from "@/lib/api/analytics";

interface LeadFunnelChartProps {
  funnel?: AnalyticsFunnelResponse;
  isLoading?: boolean;
}

export function LeadFunnelChart({ funnel, isLoading = false }: LeadFunnelChartProps) {
  const t = useTranslations("dashboard");

  const getStageLabel = (status: string): string => {
    switch (status) {
      case "NEW":
        return t("overview.funnel_stage_new");
      case "APPOINTMENT_SET":
        return t("overview.funnel_stage_appointment");
      case "DEAL_WON":
        return t("overview.funnel_stage_won");
      case "DEAL_LOST":
        return t("overview.funnel_stage_lost");
      default:
        return status;
    }
  };

  const stages: FunnelStageItem[] = (funnel?.stages || []).filter(
    (s: FunnelStageItem) => (s.status as string) !== "QUALIFIED"
  );

  const maxCount = Math.max(...stages.map((s: FunnelStageItem) => s.count || 0), 1);

  return (
    <SectionCard
      title={t("overview.funnel_title")}
      description={t("overview.funnel_desc")}
      className="h-full flex flex-col justify-between"
    >
      <div className="space-y-3.5 pt-1">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3.5 w-28 rounded-full" />
                  <Skeleton className="h-3.5 w-12 rounded-full" />
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
              </div>
            ))}
          </div>
        ) : stages.length === 0 ? (
          <div className="text-xs text-muted-foreground text-center py-8">
            {t("common.empty_data")}
          </div>
        ) : (
          stages.map((stage: FunnelStageItem, idx: number) => {
            const count = stage.count || 0;
            const percentage = Math.round((count / maxCount) * 100);
            const label = getStageLabel(stage.status);
            const isZero = count === 0;

            // Progressive subtle shading from primary violet to muted slate
            const barColor =
              stage.status === "DEAL_LOST"
                ? "bg-rose-500/80"
                : idx === 0
                ? "bg-primary"
                : idx === 1
                ? "bg-primary/85"
                : idx === 2
                ? "bg-primary/70"
                : "bg-emerald-500";

            return (
              <div key={stage.status} className="space-y-1.5 group">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-4 h-4 rounded-full bg-muted text-[10px] font-mono text-muted-foreground flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span className="font-medium text-foreground truncate">{label}</span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-semibold text-foreground tabular-nums">
                      {count}
                    </span>
                    {stage.conversionRate !== null && stage.conversionRate !== undefined && (
                      <span className="text-[11px] px-1.5 py-0.5 rounded bg-muted/60 text-muted-foreground font-mono tabular-nums">
                        {stage.conversionRate}%
                      </span>
                    )}
                  </div>
                </div>

                <div className="h-2 w-full bg-muted/50 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: isZero ? "0%" : `${Math.max(percentage, 2)}%` }}
                    transition={{ duration: 0.4, delay: idx * 0.08, ease: "easeOut" }}
                    className={`h-full rounded-full ${barColor}`}
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
