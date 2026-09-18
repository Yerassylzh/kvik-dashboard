"use client";

import React, { useState } from "react";
import { Calendar, RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { useFollowUpStats } from "@/hooks/useFollowUps";
import { FollowUpKpiCards } from "./FollowUpKpiCards";
import { FollowUpStepFunnel } from "./FollowUpStepFunnel";
import { FollowUpChannelBreakdown } from "./FollowUpChannelBreakdown";

interface FollowUpStatsTabProps {
  workspaceId?: string;
}

export function FollowUpStatsTab({ workspaceId }: FollowUpStatsTabProps) {
  const t = useTranslations("dashboard");
  const [periodDays, setPeriodDays] = useState<number>(30);

  // Compute dates based on periodDays
  const to = new Date().toISOString().split("T")[0];
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - periodDays);
  const from = fromDate.toISOString().split("T")[0];

  const { stats, isLoading, refresh } = useFollowUpStats(workspaceId, {
    from,
    to,
  });

  return (
    <div className="space-y-6">
      {/* Date Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl border border-border/80 bg-card">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs font-semibold text-foreground">
            {t("automations.stats_period_label")}
          </span>
          <div className="inline-flex rounded-lg border border-border/80 p-0.5 bg-muted/30">
            {[
              { label: t("automations.stats_period_7d"), days: 7 },
              { label: t("automations.stats_period_30d"), days: 30 },
              { label: t("automations.stats_period_90d"), days: 90 },
            ].map((p) => (
              <button
                key={p.days}
                onClick={() => setPeriodDays(p.days)}
                className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all ${
                  periodDays === p.days
                    ? "bg-white text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => refresh()}
          leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />}
          className="text-xs"
        >
          {t("automations.stats_refresh_btn")}
        </Button>
      </div>

      {/* KPI Cards */}
      <FollowUpKpiCards summary={stats?.summary} isLoading={isLoading} />

      {/* Step Progression Funnel */}
      <FollowUpStepFunnel stepBreakdown={stats?.stepBreakdown} />

      {/* Channel Comparison */}
      <FollowUpChannelBreakdown channelBreakdown={stats?.channelBreakdown} />
    </div>
  );
}
