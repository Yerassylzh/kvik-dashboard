"use client";

import React, { useState } from "react";
import { Calendar, Filter } from "lucide-react";
import { useTranslations } from "next-intl";
import { useFunnelAnalytics } from "@/hooks/useLeads";
import { Skeleton } from "@/components/ui/skeleton";
import { SegmentedTabs } from "@/components/ui/tabs";
import { FunnelKpiSummary } from "./FunnelKpiSummary";
import { FunnelVisualStepper } from "./FunnelVisualStepper";
import { FunnelStageItem } from "./FunnelStageItem";

type PeriodPreset = "7d" | "30d" | "90d" | "all" | "custom";

export function LeadsFunnel() {
  const t = useTranslations("dashboard");

  const getIsoDate = (daysAgo: number) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString().slice(0, 10);
  };

  const todayStr = new Date().toISOString().slice(0, 10);

  const [activePreset, setActivePreset] = useState<PeriodPreset>("30d");
  const [fromDate, setFromDate] = useState(() => getIsoDate(30));
  const [toDate, setToDate] = useState(() => todayStr);

  const handlePresetChange = (preset: PeriodPreset) => {
    setActivePreset(preset);
    if (preset === "7d") {
      setFromDate(getIsoDate(7));
      setToDate(todayStr);
    } else if (preset === "30d") {
      setFromDate(getIsoDate(30));
      setToDate(todayStr);
    } else if (preset === "90d") {
      setFromDate(getIsoDate(90));
      setToDate(todayStr);
    } else if (preset === "all") {
      setFromDate(getIsoDate(365));
      setToDate(todayStr);
    }
  };

  const handleCustomDateChange = (type: "from" | "to", val: string) => {
    setActivePreset("custom");
    if (type === "from") {
      setFromDate(val);
    } else {
      setToDate(val);
    }
  };

  const { funnel: rawFunnel, overallConversionRate, isLoading } = useFunnelAnalytics({
    from: fromDate || undefined,
    to: toDate || undefined,
  });

  const funnel = rawFunnel.filter((item) => (item.stage as string) !== "QUALIFIED");
  const totalLeads = funnel.length > 0 ? funnel[0].count : 0;

  const presetTabs = [
    { id: "7d" as const, label: t("leads.period_7d") },
    { id: "30d" as const, label: t("leads.period_30d") },
    { id: "90d" as const, label: t("leads.period_90d") },
    { id: "all" as const, label: t("leads.period_all") },
  ];

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Funnel header & Date filter */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-4 rounded-xl bg-card border border-border/80 shadow-2xs">
        <div>
          <h2 className="text-base font-bold text-foreground tracking-tight">
            {t("leads.funnel_title")}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t("leads.funnel_desc")}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <SegmentedTabs<PeriodPreset>
            tabs={presetTabs}
            activeTab={activePreset}
            onChange={handlePresetChange}
            className="w-auto"
          />

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border/80 bg-muted/20 text-xs">
            <Calendar className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <input
              type="date"
              value={fromDate}
              onChange={(e) => handleCustomDateChange("from", e.target.value)}
              className="bg-transparent text-foreground font-mono text-xs focus:outline-none cursor-pointer"
              aria-label={t("leads.funnel_from_label")}
            />
            <span className="text-muted-foreground/60">—</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => handleCustomDateChange("to", e.target.value)}
              className="bg-transparent text-foreground font-mono text-xs focus:outline-none cursor-pointer"
              aria-label={t("leads.funnel_to_label")}
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

      {/* Visual Pipeline Stepper */}
      {!isLoading && funnel.length > 0 && (
        <FunnelVisualStepper funnel={funnel} totalLeads={totalLeads} />
      )}

      {/* Stepped Funnel Visualization */}
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
      ) : funnel.length === 0 ? (
        <div className="p-12 text-center text-xs text-muted-foreground bg-card border border-dashed border-border/80 rounded-xl space-y-2">
          <Filter className="w-8 h-8 text-muted-foreground/40 mx-auto" />
          <p>{t("leads.timeline_empty")}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {funnel.map((item, index) => (
            <FunnelStageItem
              key={item.stage}
              item={item}
              index={index}
              isLast={index === funnel.length - 1}
              totalLeads={totalLeads}
            />
          ))}
        </div>
      )}
    </div>
  );
}
