"use client";

import React from "react";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import { InstagramFlow } from "./InstagramFlow";
import { ConnectedBadgeCard } from "./ConnectedBadgeCard";
import { InstagramChannelMetadata } from "@/types/channels";

interface StageInstagramProps {
  isConnected: boolean;
  connectedDetail?: string;
  onSuccess: (metadata: InstagramChannelMetadata) => void;
  onDisconnect: () => Promise<void>;
  disconnecting: boolean;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
}

export function StageInstagram({
  isConnected,
  connectedDetail,
  onSuccess,
  onDisconnect,
  disconnecting,
  onNext,
  onBack,
  onSkip,
}: StageInstagramProps) {
  const t = useTranslations("onboarding.channel");

  const BENEFITS = [
    { icon: "💬", text: t("instagram_benefit1") },
    { icon: "🏷", text: t("instagram_benefit2") },
    { icon: "🔗", text: t("instagram_benefit3") },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner / Channel Hero */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-purple-500/[0.06] via-pink-500/[0.04] to-amber-500/[0.04] border border-purple-500/20">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500/20 via-pink-500/20 to-purple-500/20 border border-purple-500/20 flex items-center justify-center text-2xl shrink-0 shadow-xs">
            📸
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-foreground">
                {t("instagram_title")}
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-[10px] font-extrabold text-purple-700 dark:text-purple-300 uppercase tracking-wider">
                {t("instagram_badge")}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 max-w-xl">
              {t("instagram_desc")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-semibold text-muted-foreground bg-card/80 px-2.5 py-1 rounded-xl border border-border">
            {t("stage_indicator", { current: 2, total: 3 })}
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
            channelName={t("instagram_title")}
            icon="📸"
            detail={connectedDetail}
            onDisconnect={onDisconnect}
            disconnecting={disconnecting}
            accentColor="purple"
          />

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="w-full sm:w-auto px-5 py-3 rounded-2xl font-semibold text-xs border border-border bg-card hover:bg-muted/50 text-foreground transition-colors cursor-pointer"
            >
              {t("btn_back_whatsapp")}
            </button>
            <motion.button
              type="button"
              onClick={onNext}
              whileTap={{ scale: 0.98 }}
              className="w-full sm:flex-1 py-3.5 rounded-2xl font-bold text-sm text-primary-foreground bg-primary hover:bg-primary/90 shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>{t("btn_next_telegram")}</span>
            </motion.button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <InstagramFlow
            onSuccess={onSuccess}
            onCancel={onSkip}
          />

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={onBack}
              className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              {t("btn_back_whatsapp")}
            </button>
            <button
              type="button"
              onClick={onSkip}
              className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              {t("btn_skip_instagram")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
