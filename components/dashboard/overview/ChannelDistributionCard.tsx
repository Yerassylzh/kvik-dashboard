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
  TELEGRAM: {
    label: "Telegram",
    color: "text-sky-600",
    bg: "bg-sky-50",
    border: "border-sky-200/60",
    barColor: "bg-sky-500",
  },
  WHATSAPP: {
    label: "WhatsApp",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-200/60",
    barColor: "bg-emerald-500",
  },
  INSTAGRAM: {
    label: "Instagram Direct",
    color: "text-pink-600",
    bg: "bg-pink-50",
    border: "border-pink-200/60",
    barColor: "bg-pink-500",
  },
};

function formatRuPlural(count: number, one: string, few: string, many: string): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod100 >= 11 && mod100 <= 19) return `${count} ${many}`;
  if (mod10 === 1) return `${count} ${one}`;
  if (mod10 >= 2 && mod10 <= 4) return `${count} ${few}`;
  return `${count} ${many}`;
}

export function ChannelDistributionCard({
  channels,
  isLoading = false,
}: ChannelDistributionCardProps) {
  const t = useTranslations("dashboard");

  const channelList: Array<{
    type: "TELEGRAM" | "WHATSAPP" | "INSTAGRAM";
    conversations: number;
    messages: number;
  }> = [
    {
      type: "TELEGRAM",
      conversations: channels?.TELEGRAM?.conversations || 0,
      messages: channels?.TELEGRAM?.messages || 0,
    },
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
  ];

  const totalMessages = channelList.reduce((acc, c) => acc + c.messages, 0);

  return (
    <SectionCard
      title={t("overview.channel_dist_title")}
      description={t("overview.channel_dist_desc")}
      action={
        totalMessages > 0 ? (
          <span className="text-[11px] font-mono text-muted-foreground px-2 py-0.5 rounded-full bg-muted/60">
            {formatRuPlural(totalMessages, "сообщение", "сообщения", "сообщений")}
          </span>
        ) : null
      }
      className="h-full flex flex-col justify-between"
    >
      <div className="space-y-4 pt-1">
        {/* Top Multi-Segment Proportion Bar */}
        {!isLoading && totalMessages > 0 && (
          <div className="space-y-1.5">
            <div className="h-2 w-full bg-muted/50 rounded-full overflow-hidden flex gap-0.5">
              {channelList.map((item) => {
                const share = Math.round((item.messages / totalMessages) * 100);
                if (share === 0) return null;
                const meta = channelMeta[item.type];
                return (
                  <div
                    key={item.type}
                    style={{ width: `${share}%` }}
                    className={`h-full ${meta.barColor} transition-all`}
                    title={`${meta.label}: ${share}%`}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Channel Rows */}
        <div className="divide-y divide-border/40">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between py-2.5">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-lg" />
                    <div className="space-y-1.5">
                      <Skeleton className="h-3.5 w-24 rounded-full" />
                      <Skeleton className="h-2.5 w-32 rounded-full" />
                    </div>
                  </div>
                  <div className="space-y-1 text-right">
                    <Skeleton className="h-4 w-10 rounded ml-auto" />
                    <Skeleton className="h-2.5 w-16 rounded ml-auto" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            channelList.map((item) => {
              const meta = channelMeta[item.type];
              const share = totalMessages > 0 ? Math.round((item.messages / totalMessages) * 100) : 0;
              const dialogueStr = formatRuPlural(item.conversations, "диалог", "диалога", "диалогов");
              const messageStr = formatRuPlural(item.messages, "сообщение", "сообщения", "сообщений");

              return (
                <div
                  key={item.type}
                  className="flex items-center justify-between py-2.5 px-1 hover:bg-muted/20 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg ${meta.bg} ${meta.color} border ${meta.border} flex items-center justify-center shrink-0`}
                    >
                      <ChannelIcon type={item.type} className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-xs text-foreground">{meta.label}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        {dialogueStr} • {messageStr}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-bold text-xs text-foreground font-mono tabular-nums">
                      {share}%
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {t("overview.traffic_share")}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </SectionCard>
  );
}
