"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Zap } from "lucide-react";
import { SectionCard } from "@/components/dashboard/shared/SectionCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ChannelType, MockChannel } from "@/lib/api/devMessaging";

const CHANNEL_COLORS: Record<ChannelType, string> = {
  WHATSAPP: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  INSTAGRAM: "bg-pink-500/15 text-pink-600 dark:text-pink-400 border-pink-500/30",
  TELEGRAM: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30",
};

interface DevChannelProvisionerProps {
  provisionedChannels: MockChannel[];
  isProvisioning: boolean;
  onProvision: () => void;
}

export function DevChannelProvisioner({
  provisionedChannels,
  isProvisioning,
  onProvision,
}: DevChannelProvisionerProps) {
  const t = useTranslations("dashboard");

  return (
    <SectionCard
      title={t("dev_messaging.provision_title")}
      description={t("dev_messaging.provision_desc")}
      action={
        <Button
          size="sm"
          variant="outline"
          onClick={onProvision}
          disabled={isProvisioning}
          className="gap-1.5 text-xs h-8"
        >
          <Zap className="w-3.5 h-3.5" />
          {isProvisioning ? t("common.loading") : t("dev_messaging.provision_btn")}
        </Button>
      }
    >
      {provisionedChannels.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          {t("dev_messaging.channels_empty")}. Нажмите кнопку выше, чтобы инициализировать каналы.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {provisionedChannels.map((ch) => (
            <div
              key={ch.id}
              className={`flex flex-col gap-1.5 p-3 rounded-xl border text-xs ${
                CHANNEL_COLORS[ch.type as ChannelType] || "bg-muted border-border text-foreground"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold">{ch.type}</span>
                <Badge variant="success" className="text-[10px]">
                  {ch.status}
                </Badge>
              </div>
              <span className="font-mono text-[10px] opacity-75 truncate">
                {ch.externalAccountId}
              </span>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}
