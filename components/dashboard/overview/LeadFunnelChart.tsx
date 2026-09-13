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

const stageLabels: Record<string, string> = {
  NEW: "Новые заявки",
  QUALIFIED: "Квалифицированы",
  APPOINTMENT_SET: "Создана запись",
  DEAL_WON: "Успешный визит",
  DEAL_LOST: "Отказ",
};

const stageColors: Record<string, string> = {
  NEW: "bg-blue-500",
  QUALIFIED: "bg-amber-500",
  APPOINTMENT_SET: "bg-purple-500",
  DEAL_WON: "bg-emerald-500",
  DEAL_LOST: "bg-rose-500",
};

export function LeadFunnelChart({ funnel, isLoading = false }: LeadFunnelChartProps) {
  const t = useTranslations("dashboard");
  const stages: FunnelStageItem[] = funnel?.stages || [];

  const maxCount = Math.max(...stages.map((s: FunnelStageItem) => s.count || 0), 1);

  return (
    <SectionCard
      title={t("overview.funnel_title")}
      description={t("overview.funnel_desc")}
      className="h-full"
    >
      <div className="space-y-4 pt-2">
        {isLoading ? (
          <div className="space-y-3.5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3.5 w-24 rounded-full" />
                  <Skeleton className="h-3.5 w-8 rounded-full" />
                </div>
                <Skeleton className="h-2.5 w-full rounded-full" />
              </div>
            ))}
          </div>
        ) : stages.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-6">
            {t("common.empty_data")}
          </div>
        ) : (
          stages.map((stage: FunnelStageItem, idx: number) => {
            const percentage = Math.round(((stage.count || 0) / maxCount) * 100);
            const colorClass = stageColors[stage.status] || "bg-primary";
            const label = stageLabels[stage.status] || stage.status;

            return (
              <div key={stage.status} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-foreground">{label}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-foreground tabular-nums">
                      {stage.count}
                    </span>
                    {stage.conversionRate !== null && stage.conversionRate !== undefined && (
                      <span className="text-[11px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono">
                        {stage.conversionRate}%
                      </span>
                    )}
                  </div>
                </div>

                <div className="h-2.5 w-full bg-muted/60 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.max(percentage, 4)}%` }}
                    transition={{ duration: 0.5, delay: idx * 0.1, ease: "easeOut" }}
                    className={`h-full rounded-full ${colorClass}`}
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
