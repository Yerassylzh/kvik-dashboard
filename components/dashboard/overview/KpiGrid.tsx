"use client";

import React from "react";
import { Users, CalendarCheck, MessageSquare, TrendingUp } from "lucide-react";
import { useTranslations } from "next-intl";
import { StatCard } from "@/components/dashboard/shared/StatCard";
import { StaggerContainer, StaggerItem } from "@/components/ui/motion/StaggerContainer";
import type { AnalyticsOverviewResponse } from "@/lib/api/analytics";

interface KpiGridProps {
  overview?: AnalyticsOverviewResponse;
  isLoading?: boolean;
}

export function KpiGrid({ overview, isLoading = false }: KpiGridProps) {
  const t = useTranslations("dashboard");

  const revenueDisplay = overview?.revenue?.estimatedTotal
    ? `${Number(overview.revenue.estimatedTotal).toLocaleString("ru-RU")} ${t("common.currency")}`
    : `0 ${t("common.currency")}`;

  return (
    <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StaggerItem>
        <StatCard
          label={t("overview.kpi_leads")}
          value={overview?.leads?.total ?? 0}
          isLoading={isLoading}
          icon={<Users className="w-5 h-5" />}
        />
      </StaggerItem>

      <StaggerItem>
        <StatCard
          label={t("overview.kpi_bookings")}
          value={overview?.bookings?.total ?? 0}
          isLoading={isLoading}
          icon={<CalendarCheck className="w-5 h-5" />}
        />
      </StaggerItem>

      <StaggerItem>
        <StatCard
          label={t("overview.kpi_conversations")}
          value={overview?.conversations?.total ?? 0}
          isLoading={isLoading}
          icon={<MessageSquare className="w-5 h-5" />}
        />
      </StaggerItem>

      <StaggerItem>
        <StatCard
          label={t("overview.kpi_revenue")}
          value={revenueDisplay}
          isLoading={isLoading}
          icon={<TrendingUp className="w-5 h-5" />}
        />
      </StaggerItem>
    </StaggerContainer>
  );
}
