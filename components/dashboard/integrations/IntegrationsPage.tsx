"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { DashboardPageHeader } from "@/components/dashboard/shared/DashboardPageHeader";
import { ChannelsManager } from "@/components/dashboard/settings/channels/ChannelsManager";

export function IntegrationsPage() {
  const t = useTranslations("dashboard");

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title={t("integrations.title")}
        description={t("integrations.desc")}
      />
      <ChannelsManager />
    </div>
  );
}
