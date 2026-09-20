"use client";

import React, { useState } from "react";
import { Zap, TrendingUp, History } from "lucide-react";
import { useTranslations } from "next-intl";
import { DashboardPageHeader, DashboardTabItem } from "@/components/dashboard/shared/DashboardPageHeader";
import { InsightKpiHeader } from "./cards/InsightKpiHeader";
import { RecommendationsTab } from "./tabs/RecommendationsTab";
import { DemandTrendsTab } from "./tabs/DemandTrendsTab";
import { ReportsHistoryTab } from "./tabs/ReportsHistoryTab";
import {
  useBusinessInsightsSummary,
  useInsightsRealtime,
} from "@/hooks/useBusinessInsights";

type TabId = "recommendations" | "demand_trends" | "reports_history";

export function InsightsPage() {
  const t = useTranslations("insights");
  const [activeTab, setActiveTab] = useState<TabId>("recommendations");

  useInsightsRealtime();
  const { summary, isLoading: isSummaryLoading } = useBusinessInsightsSummary();

  const tabs: DashboardTabItem[] = [
    {
      id: "recommendations",
      label: t("tabs.recommendations"),
      active: activeTab === "recommendations",
      onClick: () => setActiveTab("recommendations"),
      count: summary?.totalActive,
      icon: Zap,
    },
    {
      id: "demand_trends",
      label: t("tabs.demand_trends"),
      active: activeTab === "demand_trends",
      onClick: () => setActiveTab("demand_trends"),
      icon: TrendingUp,
    },
    {
      id: "reports_history",
      label: t("tabs.reports_history"),
      active: activeTab === "reports_history",
      onClick: () => setActiveTab("reports_history"),
      icon: History,
    },
  ];

  return (
    <div className="space-y-4">
      <DashboardPageHeader title={t("title")} tabs={tabs} />
      <InsightKpiHeader summary={summary} isLoading={isSummaryLoading} />
      <div>
        {activeTab === "recommendations" && <RecommendationsTab />}
        {activeTab === "demand_trends" && <DemandTrendsTab />}
        {activeTab === "reports_history" && <ReportsHistoryTab />}
      </div>
    </div>
  );
}
