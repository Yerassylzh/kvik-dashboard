"use client";

import React from "react";
import { Users, TrendingUp, CheckCircle2, TrendingDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { StatCard } from "@/components/dashboard/shared/StatCard";
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
  const lostCount =
    funnel.find((f) => f.stage === "DEAL_LOST")?.count ??
    Math.max(0, totalLeads - wonCount);
  const dropoffRate = totalLeads > 0 ? (lostCount / totalLeads) * 100 : 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <StatCard
        label={t("leads.funnel_total_leads")}
        value={totalLeads}
        icon={<Users className="w-4 h-4 text-primary" />}
        sublabel={totalLeads > 0 ? `${totalLeads} ${t("leads.funnel_leads_count")}` : undefined}
      />
      <StatCard
        label={t("leads.funnel_overall_rate")}
        value={`${overallConversionRate.toFixed(1)}%`}
        icon={<TrendingUp className="w-4 h-4 text-primary" />}
        sublabel={t("leads.stage_won")}
      />
      <StatCard
        label={t("leads.funnel_won_deals")}
        value={wonCount}
        icon={<CheckCircle2 className="w-4 h-4 text-emerald-600" />}
        sublabel={totalLeads > 0 ? `${((wonCount / totalLeads) * 100).toFixed(1)}% ${t("leads.funnel_share_suffix")}` : undefined}
      />
      <StatCard
        label={t("leads.funnel_lost_leads")}
        value={lostCount}
        icon={<TrendingDown className="w-4 h-4 text-rose-600" />}
        sublabel={totalLeads > 0 ? `${dropoffRate.toFixed(1)}% ${t("leads.funnel_share_suffix")}` : undefined}
      />
    </div>
  );
}
