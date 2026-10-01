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

  const totalLeads = overview?.leads?.total ?? 0;
  const dealWon = overview?.leads?.dealWon ?? 0;
  const qualifiedLeads = overview?.leads?.qualified ?? 0;
  const conversionRate =
    totalLeads > 0 ? ((dealWon / totalLeads) * 100).toFixed(1) : "0.0";

  const totalBookings = overview?.bookings?.total ?? 0;
  const completedBookings = overview?.bookings?.completed ?? 0;

  const totalConversations = overview?.conversations?.total ?? 0;
  const botHandled = overview?.conversations?.botHandled ?? 0;

  return (
    <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
      <StaggerItem>
        <StatCard
          label={t("overview.kpi_leads")}
          value={totalLeads}
          sublabel={totalLeads > 0 ? t("overview.kpi_sub_qualified", { count: qualifiedLeads }) : undefined}
          isLoading={isLoading}
          icon={<Users className="w-4.5 h-4.5" />}
        />
      </StaggerItem>

      <StaggerItem>
        <StatCard
          label={t("overview.kpi_bookings")}
          value={totalBookings}
          sublabel={totalBookings > 0 ? t("overview.kpi_sub_completed", { count: completedBookings }) : undefined}
          isLoading={isLoading}
          icon={<CalendarCheck className="w-4.5 h-4.5" />}
        />
      </StaggerItem>

      <StaggerItem>
        <StatCard
          label={t("overview.kpi_conversations")}
          value={totalConversations}
          sublabel={totalConversations > 0 ? t("overview.kpi_sub_bot_handled", { count: botHandled }) : undefined}
          isLoading={isLoading}
          icon={<MessageSquare className="w-4.5 h-4.5" />}
        />
      </StaggerItem>

      <StaggerItem>
        <StatCard
          label={t("overview.kpi_conversion")}
          value={`${conversionRate}%`}
          sublabel={totalLeads > 0 ? t("overview.kpi_sub_completed_visits", { count: dealWon }) : undefined}
          isLoading={isLoading}
          icon={<TrendingUp className="w-4.5 h-4.5" />}
        />
      </StaggerItem>
    </StaggerContainer>
  );
}
