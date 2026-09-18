"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { SectionCard } from "@/components/dashboard/shared/SectionCard";
import { Badge } from "@/components/ui/badge";
import type { ChannelPolicyStatus } from "@/lib/api/followUps";
import type { ChannelType } from "@/types/channels";

interface ChannelPolicyStatusCardProps {
  channels?: Partial<Record<ChannelType, ChannelPolicyStatus>>;
}

export function ChannelPolicyStatusCard({
  channels = {},
}: ChannelPolicyStatusCardProps) {
  const t = useTranslations("dashboard");
  const wa = channels.WHATSAPP;
  const ig = channels.INSTAGRAM;
  const tg = channels.TELEGRAM;

  return (
    <SectionCard
      title={t("automations.channel_policies_title")}
      description={t("automations.channel_policies_desc")}
    >
      <div className="space-y-3">
        {/* WhatsApp */}
        <div className="p-3 rounded-xl border border-border/70 bg-card space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <span
                className={`h-2 w-2 rounded-full ${
                  wa?.active ? "bg-emerald-500" : "bg-muted-foreground"
                }`}
              ></span>
              {t("automations.channel_wa_name")}
            </span>
            {wa?.active ? (
              <Badge
                variant={wa.wabaTemplateConfigured ? "success" : "warning"}
                className="text-[10px]"
              >
                {wa.wabaTemplateConfigured
                  ? t("automations.channel_wa_badge_ready")
                  : t("automations.channel_wa_badge_pending")}
              </Badge>
            ) : (
              <Badge variant="default" className="text-[10px]">
                {t("automations.channel_not_connected")}
              </Badge>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            {t("automations.channel_wa_desc")}
          </p>
        </div>

        {/* Instagram */}
        <div className="p-3 rounded-xl border border-border/70 bg-card space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <span
                className={`h-2 w-2 rounded-full ${
                  ig?.active ? "bg-indigo-500" : "bg-muted-foreground"
                }`}
              ></span>
              {t("automations.channel_ig_name")}
            </span>
            {ig?.active ? (
              <Badge
                variant={ig.crossChannelFallback ? "success" : "default"}
                className="text-[10px]"
              >
                {ig.crossChannelFallback
                  ? t("automations.channel_ig_badge_fallback")
                  : t("automations.channel_ig_badge_window")}
              </Badge>
            ) : (
              <Badge variant="default" className="text-[10px]">
                {t("automations.channel_not_connected")}
              </Badge>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            {t("automations.channel_ig_desc")}
          </p>
        </div>

        {/* Telegram */}
        <div className="p-3 rounded-xl border border-border/70 bg-card space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <span
                className={`h-2 w-2 rounded-full ${
                  tg?.active ? "bg-sky-500" : "bg-muted-foreground"
                }`}
              ></span>
              {t("automations.channel_tg_name")}
            </span>
            {tg?.active ? (
              <Badge variant="success" className="text-[10px]">
                {t("automations.channel_tg_badge_unlimited")}
              </Badge>
            ) : (
              <Badge variant="default" className="text-[10px]">
                {t("automations.channel_not_connected")}
              </Badge>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            {t("automations.channel_tg_desc")}
          </p>
        </div>
      </div>
    </SectionCard>
  );
}
