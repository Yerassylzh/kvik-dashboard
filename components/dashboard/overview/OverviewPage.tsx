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
    <FadeIn direction="up" distance={20} duration={0.25} className="space-y-6">
      <PageHeader
        title={t("page.overview_title")}
        description={t("page.overview_desc")}
        action={
          <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border/50">
            {periodButtons.map((btn) => (
              <button
                key={btn.id}
                type="button"
                onClick={() => setPreset(btn.id)}
                className={clsx(
                  "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                  preset === btn.id
                    ? "bg-background text-foreground shadow-sm border border-border/50"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t(btn.labelKey as any)}
              </button>
            ))}
          </div>
        }
      />

      <AiAgentStatusCard overview={overview} isLoading={isLoading} />

      <KpiGrid overview={overview} isLoading={isLoading} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LeadFunnelChart funnel={funnel} isLoading={isLoading} />
        <TodayBookings bookings={bookings} isLoading={isLoading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChannelDistributionCard channels={channels} isLoading={isLoading} />
        <StaffWorkloadTable staffList={staffAnalytics} isLoading={isLoading} />
      </div>
    </FadeIn>
  );
}
