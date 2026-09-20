"use client";

import React, { useState, useMemo } from "react";
import { useDemandTrends } from "@/hooks/useBusinessInsights";
import { UnmetServicesChart } from "../charts/UnmetServicesChart";
import { HourlyDistributionChart } from "../charts/HourlyDistributionChart";
import { TopObjectionsChart } from "../charts/TopObjectionsChart";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

const DATE_PRESETS = [
  { id: "7d", days: 7 },
  { id: "14d", days: 14 },
  { id: "30d", days: 30 },
  { id: "90d", days: 90 },
];

export function DemandTrendsTab() {
  const t = useTranslations("insights");
  const [selectedPreset, setSelectedPreset] = useState("30d");

  const { from, to } = useMemo(() => {
    const preset = DATE_PRESETS.find((p) => p.id === selectedPreset) || DATE_PRESETS[2];
    const toDate = new Date();
    const fromDate = new Date();
    fromDate.setDate(toDate.getDate() - preset.days);
    return {
      from: fromDate.toISOString().split("T")[0],
      to: toDate.toISOString().split("T")[0],
    };
  }, [selectedPreset]);

  const { demandTrends, isLoading } = useDemandTrends(undefined, { from, to });

  return (
    <div className="space-y-4">
      {/* Preset selector — minimal, right-aligned */}
      <div className="flex justify-end">
        <div className="flex items-center gap-0.5 bg-muted/40 p-0.5 rounded-lg border border-border/60">
          {DATE_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setSelectedPreset(p.id)}
              className={cn(
                "px-2.5 py-1 text-xs rounded-md font-medium transition-colors cursor-pointer select-none",
                selectedPreset === p.id
                  ? "bg-card text-foreground font-semibold shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t("demand.preset_days", { count: p.days })}
            </button>
          ))}
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <UnmetServicesChart data={demandTrends?.unmetServices} isLoading={isLoading} />
        <TopObjectionsChart data={demandTrends?.topObjections} isLoading={isLoading} />
        <div className="lg:col-span-2">
          <HourlyDistributionChart data={demandTrends?.hourlyInquiryDistribution} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
}
