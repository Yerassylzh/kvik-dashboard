"use client";

import React, { useState } from "react";
import { MessageCircle, Calendar as CalendarIcon, Webhook, CheckCircle2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { DashboardPageHeader } from "@/components/dashboard/shared/DashboardPageHeader";
import { Badge } from "@/components/ui/badge";
import { ChannelsManager } from "@/components/dashboard/settings/channels/ChannelsManager";

type IntegrationsTab = "channels" | "calendars" | "webhooks";

export function IntegrationsPage() {
  const t = useTranslations("dashboard");
  const [activeTab, setActiveTab] = useState<IntegrationsTab>("channels");

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title={t("integrations.title")}
        description={t("integrations.desc")}
        badge={<Badge variant="success">Multi-Channel Bridge</Badge>}
        tabs={[
          {
            id: "channels",
            label: t("integrations.tab_channels"),
            icon: MessageCircle,
            active: activeTab === "channels",
            onClick: () => setActiveTab("channels"),
          },
          {
            id: "calendars",
            label: t("integrations.tab_calendars"),
            icon: CalendarIcon,
            active: activeTab === "calendars",
            onClick: () => setActiveTab("calendars"),
          },
          {
            id: "webhooks",
            label: t("integrations.tab_webhooks"),
            icon: Webhook,
            active: activeTab === "webhooks",
            onClick: () => setActiveTab("webhooks"),
          },
        ]}
      />

      {activeTab === "channels" && <ChannelsManager />}

      {activeTab === "calendars" && (
        <div className="p-8 text-center border border-dashed border-border/80 rounded-2xl bg-card/40 space-y-3">
          <CalendarIcon className="w-8 h-8 text-primary mx-auto opacity-80" />
          <h3 className="text-sm font-bold text-foreground">
            Двусторонняя синхронизация с внешними календарями
          </h3>
          <p className="text-xs text-muted-foreground max-w-lg mx-auto leading-relaxed">
            Подключите Google Calendar или YCLIENTS (Altegio), чтобы записи от ИИ автоматически
            появлялись в вашей основной CRM, а занятые слоты из внешнего календаря блокировались
            для онлайн-записи.
          </p>
          <div className="pt-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" /> Встроенный календарь Kvik активен по умолчанию
            </span>
          </div>
        </div>
      )}

      {activeTab === "webhooks" && (
        <div className="p-8 text-center border border-dashed border-border/80 rounded-2xl bg-card/40 space-y-3">
          <Webhook className="w-8 h-8 text-primary mx-auto opacity-80" />
          <h3 className="text-sm font-bold text-foreground">
            {t("integrations.webhooks_title")}
          </h3>
          <p className="text-xs text-muted-foreground max-w-lg mx-auto leading-relaxed">
            {t("integrations.webhooks_desc")}
          </p>
          <div className="pt-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 text-xs font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" /> {t("integrations.webhooks_active_status")}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
