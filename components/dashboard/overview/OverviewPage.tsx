"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { FadeIn } from "@/components/ui/motion/FadeIn";
import { DashboardPageHeader } from "@/components/dashboard/shared/DashboardPageHeader";
import { KpiGrid } from "./KpiGrid";
import { LeadFunnelChart } from "./LeadFunnelChart";
import { TodayBookings } from "./TodayBookings";
import { ChannelDistributionCard } from "./ChannelDistributionCard";
import { AiAgentStatusCard } from "./AiAgentStatusCard";
import { StaffWorkloadTable } from "./StaffWorkloadTable";
import { TelegramAlertsBanner } from "./TelegramAlertsBanner";
import { useAnalytics, type DatePreset } from "@/hooks/useAnalytics";
import { useBookings } from "@/hooks/useBookings";
import clsx from "clsx";

const periodButtons: Array<{
  id: DatePreset;
  key:
    | "overview.period_today"
    | "overview.period_7d"
    | "overview.period_30d"
    | "overview.period_90d";
}> = [
  { id: "today", key: "overview.period_today" },
  { id: "7d", key: "overview.period_7d" },
  { id: "30d", key: "overview.period_30d" },
  { id: "90d", key: "overview.period_90d" },
];

export function OverviewPage() {
  const t = useTranslations("dashboard");
  const { preset, setPreset, overview, funnel, channels, staffAnalytics, isLoading } =
    useAnalytics();
  const { bookings } = useBookings();

  return (
    <FadeIn direction="up" distance={10} duration={0.2} className="space-y-4 sm:space-y-5">
      <DashboardPageHeader
        title={t("page.overview_title")}
        actions={
          <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg border border-border/70 w-fit">
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
                {t(btn.key)}
              </button>
            ))}
          </div>
        }
      />

      <TelegramAlertsBanner />

      <AiAgentStatusCard overview={overview} isLoading={isLoading} />

      <KpiGrid overview={overview} isLoading={isLoading} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 items-stretch">
        <LeadFunnelChart funnel={funnel} isLoading={isLoading} />
        <TodayBookings bookings={bookings} isLoading={isLoading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 items-stretch">
        <ChannelDistributionCard channels={channels} isLoading={isLoading} />
        <StaffWorkloadTable staffList={staffAnalytics} isLoading={isLoading} />
      </div>
    </FadeIn>
  );
}
