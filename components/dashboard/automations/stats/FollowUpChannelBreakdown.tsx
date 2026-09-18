"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { SectionCard } from "@/components/dashboard/shared/SectionCard";
import type { ChannelStatItem } from "@/lib/api/followUps";
import type { ChannelType } from "@/types/channels";

interface FollowUpChannelBreakdownProps {
  channelBreakdown?: Partial<Record<ChannelType, ChannelStatItem>>;
}

export function FollowUpChannelBreakdown({
  channelBreakdown = {},
}: FollowUpChannelBreakdownProps) {
  const t = useTranslations("dashboard");

  const channelsConfig: Array<{
    type: ChannelType;
    label: string;
    dotColor: string;
  }> = [
    {
      type: "WHATSAPP",
      label: t("automations.channel_wa_name"),
      dotColor: "bg-emerald-500",
    },
    {
      type: "INSTAGRAM",
      label: t("automations.channel_ig_name"),
      dotColor: "bg-indigo-500",
    },
    {
      type: "TELEGRAM",
      label: t("automations.channel_tg_name"),
      dotColor: "bg-sky-500",
    },
  ];

  return (
    <SectionCard
      title={t("automations.stats_channel_perf")}
      description={t("automations.stats_channel_desc")}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {channelsConfig.map(({ type, label, dotColor }) => {
          const stat = channelBreakdown[type] || {
            dispatched: 0,
            replied: 0,
            replyRate: 0,
          };

          return (
            <div
              key={type}
              className="p-4 rounded-xl border border-border/70 bg-card space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <span className={`h-2 w-2 rounded-full ${dotColor}`}></span>
                  {label}
                </span>
                <span className="text-xs font-bold text-primary tabular-nums">
                  {t("automations.stats_channel_reply_rate", { rate: stat.replyRate })}
                </span>
              </div>

              <div className="space-y-1.5 pt-1 text-xs">
                <div className="flex justify-between text-muted-foreground">
                  <span>{t("automations.stats_dispatched_label")}</span>
                  <strong className="text-foreground tabular-nums">
                    {stat.dispatched}
                  </strong>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>{t("automations.stats_replied_label")}</span>
                  <strong className="text-foreground tabular-nums">
                    {stat.replied}
                  </strong>
                </div>
              </div>

              {/* Mini progress */}
              <div className="w-full bg-muted/60 h-1.5 rounded-full overflow-hidden flex">
                <div
                  style={{ width: `${Math.min(100, stat.replyRate)}%` }}
                  className="bg-primary h-full rounded-full transition-all duration-500"
                />
              </div>
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}
