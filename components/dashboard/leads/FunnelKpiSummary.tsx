"use client";

import React from "react";
import { TrendingUp, Inbox, CheckCircle2 } from "lucide-react";
import { useTranslations } from "next-intl";
import type { FunnelStageDto } from "@/lib/api/leads";

interface FunnelKpiSummaryProps {
  overallConversionRate: number;
  totalLeads: number;
  funnel: FunnelStageDto[];
}

export function FunnelKpiSummary({
  overallConversionRate,
  totalLeads,
  funnel,
}: FunnelKpiSummaryProps) {
  const t = useTranslations("dashboard");
  const wonCount = funnel.find((f) => f.stage === "DEAL_WON")?.count ?? 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      <div className="p-4 rounded-2xl bg-card border border-border/70 shadow-xs flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold text-muted-foreground">
            {t("leads.funnel_overall_rate")}
          </div>
          <div className="text-2xl font-bold text-foreground tabular-nums mt-1">
            {overallConversionRate.toFixed(1)}%
          </div>
        </div>
        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
          <TrendingUp className="w-5 h-5" />
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-card border border-border/70 shadow-xs flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold text-muted-foreground">
            {t("leads.funnel_total_leads")}
          </div>
          <div className="text-2xl font-bold text-foreground tabular-nums mt-1">
            {totalLeads}
          </div>
        </div>
        <div className="w-10 h-10 rounded-xl bg-muted text-muted-foreground flex items-center justify-center">
          <Inbox className="w-5 h-5" />
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-card border border-border/70 shadow-xs flex items-center justify-between sm:col-span-2 lg:col-span-1">
        <div>
          <div className="text-xs font-semibold text-muted-foreground">
            {t("leads.stage_won")}
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums mt-1">
            {wonCount}
          </div>
        </div>
        <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
          <CheckCircle2 className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
