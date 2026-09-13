"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { SectionCard } from "@/components/dashboard/shared/SectionCard";
import { ChannelIcon } from "@/components/ui/channel-icon";
import { Skeleton } from "@/components/ui/skeleton";
import type { ChannelsAnalyticsResponse } from "@/lib/api/analytics";

interface ChannelDistributionCardProps {
  channels?: ChannelsAnalyticsResponse;
  isLoading?: boolean;
}

const channelMeta = {
  WHATSAPP: {
    label: "WhatsApp",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
  },
  INSTAGRAM: {
    label: "Instagram Direct",
    color: "text-pink-500",
    bg: "bg-pink-500/10",
    border: "border-pink-500/20",
  },
  TELEGRAM: {
    label: "Telegram",
    color: "text-sky-500",
    bg: "bg-sky-500/10",
    border: "border-sky-500/20",
  },
};

export function ChannelDistributionCard({
  channels,
  isLoading = false,
}: ChannelDistributionCardProps) {
  const t = useTranslations("dashboard");

  const channelList: Array<{
    type: "WHATSAPP" | "INSTAGRAM" | "TELEGRAM";
    conversations: number;
    messages: number;
  }> = [
    {
      type: "WHATSAPP",
      conversations: channels?.WHATSAPP?.conversations || 0,
      messages: channels?.WHATSAPP?.messages || 0,
    },
    {
      type: "INSTAGRAM",
      conversations: channels?.INSTAGRAM?.conversations || 0,
      messages: channels?.INSTAGRAM?.messages || 0,
    },
    {
      type: "TELEGRAM",
      conversations: channels?.TELEGRAM?.conversations || 0,
      messages: channels?.TELEGRAM?.messages || 0,
    },
  ];

  const totalMessages = channelList.reduce((acc, c) => acc + c.messages, 0);

  return (
    <SectionCard
      title={t("overview.channel_dist_title")}
      description={t("overview.channel_dist_desc")}
      className="h-full"
    >
      <div className="space-y-3 pt-1">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-muted/20"
              >
                <div className="flex items-center gap-3">
                  <Skeleton className="h-9 w-9 rounded-lg" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-3.5 w-24 rounded-full" />
                    <Skeleton className="h-2.5 w-32 rounded-full" />
                  </div>
                </div>
                <div className="space-y-1 text-right">
                  <Skeleton className="h-4 w-10 rounded-md ml-auto" />
                  <Skeleton className="h-2.5 w-14 rounded-full ml-auto" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          channelList.map((item) => {
            const meta = channelMeta[item.type];
            const share = totalMessages > 0 ? Math.round((item.messages / totalMessages) * 100) : 0;

            return (
              <div
                key={item.type}
                className={`flex items-center justify-between p-3 rounded-xl border ${meta.border} ${meta.bg}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-background/80 ${meta.color}`}>
                    <ChannelIcon type={item.type} className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-foreground">{meta.label}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {item.conversations} диалогов • {item.messages} сообщений
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-bold text-sm text-foreground font-mono">{share}%</div>
                  <div className="text-[11px] text-muted-foreground">доля трафика</div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </SectionCard>
  );
}
