"use client";

import React from "react";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";

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
      icon: "💬",
      label: t("tab_whatsapp"),
      connected: isWhatsAppConnected,
      color: "emerald",
    },
    {
      id: 1,
      icon: "📸",
      label: t("tab_instagram"),
      connected: isInstagramConnected,
      color: "purple",
    },
    {
      id: 2,
      icon: "✈️",
      label: t("tab_telegram"),
      connected: isTelegramConnected,
      color: "sky",
    },
    {
      id: 3,
      icon: "✨",
      label: t("tab_summary"),
      connected: connectedCount > 0,
      badge: connectedCount > 0 ? `${connectedCount}/3` : undefined,
      color: "indigo",
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
              <span className="text-sm">{stage.icon}</span>
              <span className="truncate">{stage.label}</span>

              {stage.badge ? (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
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
