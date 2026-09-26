"use client";

import React from "react";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import { TelegramFlow } from "./TelegramFlow";
import { ConnectedBadgeCard } from "./ConnectedBadgeCard";
import { TelegramChannelMetadata } from "@/types/channels";

interface StageTelegramProps {
  isConnected: boolean;
  connectedDetail?: string;
  onSuccess: (metadata: TelegramChannelMetadata) => void;
  onDisconnect: () => Promise<void>;
  disconnecting: boolean;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
}

export function StageTelegram({
  isConnected,
  connectedDetail,
  onSuccess,
  onDisconnect,
  disconnecting,
  onNext,
  onBack,
  onSkip,
}: StageTelegramProps) {
  const t = useTranslations("onboarding.channel");

  const BENEFITS = [
    { icon: "🤖", text: t("telegram_benefit1") },
    { icon: "⚡", text: t("telegram_benefit2") },
    { icon: "👥", text: t("telegram_benefit3") },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner / Channel Hero */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-sky-500/[0.05] border border-sky-500/20">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-2xl shrink-0 shadow-xs">
            ✈️
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-foreground">
                {t("telegram_title")}
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-[10px] font-extrabold text-sky-600 dark:text-sky-400 uppercase tracking-wider">
                {t("telegram_badge")}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 max-w-xl">
              {t("telegram_desc")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-semibold text-muted-foreground bg-card/80 px-2.5 py-1 rounded-xl border border-border">
            {t("stage_indicator", { current: 3, total: 3 })}
          </span>
        </div>
      </div>

      {/* 3 Key Benefits */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {BENEFITS.map((b, idx) => (
          <div
            key={idx}
            className="flex items-center gap-2.5 p-3 rounded-xl bg-card border border-border text-xs text-foreground font-medium"
          >
            <span className="text-base shrink-0">{b.icon}</span>
            <span className="leading-tight">{b.text}</span>
          </div>
        ))}
      </div>

      {/* Main Flow Content */}
      {isConnected ? (
        <div className="space-y-4">
          <ConnectedBadgeCard
            channelName={t("telegram_title")}
            icon="✈️"
            detail={connectedDetail}
            onDisconnect={onDisconnect}
            disconnecting={disconnecting}
            accentColor="sky"
          />

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="w-full sm:w-auto px-5 py-3 rounded-2xl font-semibold text-xs border border-border bg-card hover:bg-muted/50 text-foreground transition-colors cursor-pointer"
            >
              {t("btn_back_instagram")}
            </button>
            <motion.button
              type="button"
              onClick={onNext}
              whileTap={{ scale: 0.98 }}
              className="w-full sm:flex-1 py-3.5 rounded-2xl font-bold text-sm text-primary-foreground bg-primary hover:bg-primary/90 shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>{t("btn_next_summary")}</span>
            </motion.button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <TelegramFlow
            onSuccess={onSuccess}
            onCancel={onSkip}
          />

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={onBack}
              className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              {t("btn_back_instagram")}
            </button>
            <button
              type="button"
              onClick={onSkip}
              className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              {t("btn_skip_telegram")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
