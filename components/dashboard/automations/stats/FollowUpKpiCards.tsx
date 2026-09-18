"use client";

import React from "react";
import { Send, MessageCircle, CalendarCheck, Star } from "lucide-react";
import { useTranslations } from "next-intl";
import { StatCard } from "@/components/dashboard/shared/StatCard";
import type { FollowUpStatsDto } from "@/lib/api/followUps";

interface FollowUpKpiCardsProps {
  summary?: FollowUpStatsDto["summary"];
  isLoading?: boolean;
}

export function FollowUpKpiCards({
  summary,
  isLoading = false,
}: FollowUpKpiCardsProps) {
  const t = useTranslations("dashboard");

  const dispatched = summary?.totalFollowUpsDispatched ?? 0;
  const replied = summary?.totalReplied ?? 0;
  const replyRate = summary?.replyRate ?? 0;
  const bookings = summary?.bookingsGenerated ?? 0;
  const bookingRate = summary?.conversionToBookingRate ?? 0;
  const reviews = summary?.reviewsRequested ?? 0;
  const reviewsSubmitted = summary?.estimatedReviewsSubmitted ?? 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        icon={<Send className="w-4 h-4" />}
        label={t("automations.stats_kpi_dispatched")}
        value={dispatched}
        sublabel={t("automations.stats_sub_dispatched")}
        isLoading={isLoading}
      />

      <StatCard
        icon={<MessageCircle className="w-4 h-4" />}
        label={t("automations.stats_kpi_replied")}
        value={`${replyRate}%`}
        sublabel={t("automations.stats_sub_replied", { count: replied })}
        isLoading={isLoading}
      />

      <StatCard
        icon={<CalendarCheck className="w-4 h-4" />}
        label={t("automations.stats_kpi_bookings")}
        value={bookings}
        sublabel={t("automations.stats_sub_bookings", { rate: bookingRate })}
        isLoading={isLoading}
      />

      <StatCard
        icon={<Star className="w-4 h-4" />}
        label={t("automations.stats_kpi_reviews")}
        value={reviews}
        sublabel={t("automations.stats_sub_reviews", { count: reviewsSubmitted })}
        isLoading={isLoading}
      />
    </div>
  );
}
