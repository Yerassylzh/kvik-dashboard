"use client";

import React from "react";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import { ChannelIcon } from "@/components/ui/channel-icon";
import { CheckCheck } from "lucide-react";

interface ChannelStepperProps {
  activeStage: number;
  onSelectStage: (stage: number) => void;
  isWhatsAppConnected: boolean;
  isInstagramConnected: boolean;
  isTelegramConnected: boolean;
  connectedCount: number;
}

export function ChannelStepper({
  activeStage,
  onSelectStage,
  isWhatsAppConnected,
  isInstagramConnected,
  isTelegramConnected,
  connectedCount,
}: ChannelStepperProps) {
  const t = useTranslations("onboarding.channel");

  const STAGES = [
    {
      id: 0,
      type: "WHATSAPP" as const,
      label: t("tab_whatsapp"),
      connected: isWhatsAppConnected,
    },
    {
      id: 1,
      type: "INSTAGRAM" as const,
      label: t("tab_instagram"),
      connected: isInstagramConnected,
    },
    {
      id: 2,
      type: "TELEGRAM" as const,
      label: t("tab_telegram"),
      connected: isTelegramConnected,
    },
    {
      id: 3,
      type: "SUMMARY" as const,
      label: t("tab_summary"),
      connected: connectedCount > 0,
      badge: connectedCount > 0 ? `${connectedCount}/3` : undefined,
    },
  ];

  return (
    <div className="w-full">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-1.5 rounded-2xl bg-muted/40 border border-border">
        {STAGES.map((stage) => {
          const isActive = activeStage === stage.id;
          return (
            <button
              key={stage.id}
              type="button"
              onClick={() => onSelectStage(stage.id)}
              className={`relative flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer select-none ${
                isActive
                  ? "bg-card text-foreground shadow-sm border border-border font-bold ring-1 ring-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-card/40"
              }`}
            >
              {stage.type === "SUMMARY" ? (
                <CheckCheck className="w-3.5 h-3.5 text-muted-foreground" />
              ) : (
                <ChannelIcon type={stage.type} className="w-3.5 h-3.5" />
              )}
              <span className="truncate">{stage.label}</span>

              {stage.badge ? (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold tabular-nums ${
                    stage.connected
                      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {stage.badge}
                </span>
              ) : stage.connected ? (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="h-2 w-2 rounded-full bg-emerald-500 flex-shrink-0"
                />
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
