"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { useFunnelAnalytics } from "@/hooks/useLeads";
import { Skeleton } from "@/components/ui/skeleton";
import { FunnelKpiSummary } from "./FunnelKpiSummary";
import { FunnelStageItem } from "./FunnelStageItem";

export function LeadsFunnel() {
  const t = useTranslations("dashboard");

  // Default to last 30 days
  const now = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(now.getDate() - 30);

  const [fromDate, setFromDate] = useState(thirtyDaysAgo.toISOString().slice(0, 10));
  const [toDate, setToDate] = useState(now.toISOString().slice(0, 10));

  const { funnel, overallConversionRate, isLoading } = useFunnelAnalytics({
    from: fromDate || undefined,
    to: toDate || undefined,
  });

  const totalLeads = funnel.length > 0 ? funnel[0].count : 0;

  return (
    <div className="space-y-6">
      {/* Funnel header & Date filter */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-card border border-border/70 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-foreground">
            {t("leads.funnel_title")}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t("leads.funnel_desc")}
          </p>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>{t("leads.funnel_from_label")}:</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="rounded-lg border border-input bg-card px-2 py-1 text-xs text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-primary/20"
            />
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>{t("leads.funnel_to_label")}:</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="rounded-lg border border-input bg-card px-2 py-1 text-xs text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-primary/20"
            />
          </div>
        </div>
      </div>

      {/* KPI Overview */}
      <FunnelKpiSummary
        overallConversionRate={overallConversionRate}
        totalLeads={totalLeads}
        funnel={funnel}
      />

      {/* Stepped Funnel Visualization */}
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
        </div>
      ) : funnel.length === 0 ? (
        <div className="p-12 text-center text-xs text-muted-foreground bg-card border border-border/70 rounded-2xl">
          {t("leads.timeline_empty")}
        </div>
      ) : (
        <div className="space-y-3">
          {funnel.map((item, index) => (
            <FunnelStageItem
              key={item.stage}
              item={item}
              isLast={index === funnel.length - 1}
              totalLeads={totalLeads}
            />
          ))}
        </div>
      )}
    </div>
  );
}

