"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { FadeIn } from "@/components/ui/motion/FadeIn";
import { PageHeader } from "@/components/dashboard/shared/PageHeader";
import { KpiGrid } from "./KpiGrid";
import { LeadFunnelChart } from "./LeadFunnelChart";
import { TodayBookings } from "./TodayBookings";
import { ChannelDistributionCard } from "./ChannelDistributionCard";
import { AiAgentStatusCard } from "./AiAgentStatusCard";
import { StaffWorkloadTable } from "./StaffWorkloadTable";
import { useAnalytics, type DatePreset } from "@/hooks/useAnalytics";
import { useBookings } from "@/hooks/useBookings";
import clsx from "clsx";

const periodButtons: Array<{ id: DatePreset; labelKey: string }> = [
  { id: "today", labelKey: "overview.period_today" },
  { id: "7d", labelKey: "overview.period_7d" },
  { id: "30d", labelKey: "overview.period_30d" },
  { id: "90d", labelKey: "overview.period_90d" },
];

export function OverviewPage() {
  const t = useTranslations("dashboard");
  const { preset, setPreset, overview, funnel, channels, staffAnalytics, isLoading } =
    useAnalytics();
  const { bookings } = useBookings();

  return (
    <FadeIn direction="up" distance={10} duration={0.2} className="space-y-4 sm:space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/70">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-foreground tracking-tight">
            {t("page.overview_title")}
          </h1>
        </div>

        <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg border border-border/70 w-fit">
          {periodButtons.map((btn) => (
            <button
              key={btn.id}
              type="button"
              onClick={() => setPreset(btn.id)}
              className={clsx(
                "px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer",
                preset === btn.id
                  ? "bg-card text-foreground shadow-2xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t(btn.labelKey as any)}
            </button>
          ))}
        </div>
      </div>

      <AiAgentStatusCard overview={overview} isLoading={isLoading} />

      <KpiGrid overview={overview} isLoading={isLoading} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
        <LeadFunnelChart funnel={funnel} isLoading={isLoading} />
        <TodayBookings bookings={bookings} isLoading={isLoading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
        <ChannelDistributionCard channels={channels} isLoading={isLoading} />
        <StaffWorkloadTable staffList={staffAnalytics} isLoading={isLoading} />
      </div>
    </FadeIn>
  );
}
