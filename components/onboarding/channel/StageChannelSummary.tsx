"use client";

import React from "react";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import { ChannelType, ChannelStatus } from "@/types/channels";

interface ConnectedChannel {
  status: ChannelStatus;
  detail?: string;
}

interface StageChannelSummaryProps {
  channels: Partial<Record<ChannelType, ConnectedChannel>>;
  onSelectStage: (stage: number) => void;
  onContinue: () => void;
  continueLoading: boolean;
  onDisconnect: (type: ChannelType) => Promise<void>;
  disconnecting: ChannelType | null;
}

export function StageChannelSummary({
  channels,
  onSelectStage,
  onContinue,
  continueLoading,
  onDisconnect,
  disconnecting,
}: StageChannelSummaryProps) {
  const t = useTranslations("onboarding.channel");

  const channelConfigs: {
    type: ChannelType;
    stageIndex: number;
    title: string;
    icon: string;
    badge: string;
    colorClasses: {
      bg: string;
      border: string;
      iconBg: string;
      badge: string;
    };
  }[] = [
    {
      type: "WHATSAPP",
      stageIndex: 0,
      title: t("whatsapp_title"),
      icon: "💬",
      badge: t("recommended_badge"),
      colorClasses: {
        bg: "bg-emerald-500/[0.03]",
        border: "border-emerald-500/20",
        iconBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
        badge: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
      },
    },
    {
      type: "INSTAGRAM",
      stageIndex: 1,
      title: t("instagram_title"),
      icon: "📸",
      badge: t("direct_badge"),
      colorClasses: {
        bg: "bg-purple-500/[0.03]",
        border: "border-purple-500/20",
        iconBg: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
        badge: "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20",
      },
    },
    {
      type: "TELEGRAM",
      stageIndex: 2,
      title: t("telegram_title"),
      icon: "✈️",
      badge: t("telegram_badge"),
      colorClasses: {
        bg: "bg-sky-500/[0.03]",
        border: "border-sky-500/20",
        iconBg: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
        badge: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
      },
    },
  ];

  const connectedCount = Object.values(channels).filter(
    (c) => c?.status === "CONNECTED"
  ).length;

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="text-center max-w-xl mx-auto">
        <h3 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
          {t("summary_title")}
        </h3>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 leading-relaxed">
          {t("summary_desc")}
        </p>
      </div>

      {/* 3 Channels Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {channelConfigs.map((cfg) => {
          const ch = channels[cfg.type];
          const isConnected = ch?.status === "CONNECTED";
          const isDisconnecting = disconnecting === cfg.type;

          return (
            <div
              key={cfg.type}
              className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                isConnected
                  ? `${cfg.colorClasses.bg} ${cfg.colorClasses.border} shadow-xs`
                  : "bg-card/60 border-border opacity-85"
              }`}
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div
                    className={`w-10 h-10 rounded-xl border flex items-center justify-center text-xl shrink-0 ${
                      isConnected ? cfg.colorClasses.iconBg : "bg-muted border-border text-muted-foreground"
                    }`}
                  >
                    {cfg.icon}
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      isConnected
                        ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                        : "bg-muted text-muted-foreground border-border"
                    }`}
                  >
                    {isConnected ? t("summary_connected") : t("summary_not_connected")}
                  </span>
                </div>

                {/* Title & Detail */}
                <h4 className="font-bold text-sm text-foreground">
                  {cfg.title}
                </h4>

                {isConnected && ch?.detail ? (
                  <p className="text-xs font-mono font-semibold text-emerald-700 dark:text-emerald-400 mt-1 truncate">
                    {ch.detail}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground mt-1">
                    {isConnected ? t("connected_ready_status") : t("status_not_connected")}
                  </p>
                )}
              </div>

              {/* Action */}
              <div className="mt-5 pt-3 border-t border-border/60 flex items-center justify-between">
                {isConnected ? (
                  <>
                    <button
                      type="button"
                      onClick={() => onSelectStage(cfg.stageIndex)}
                      className="text-xs font-medium text-primary hover:underline cursor-pointer"
                    >
                      {t("summary_change_action")}
                    </button>
                    <button
                      type="button"
                      disabled={isDisconnecting}
                      onClick={() => onDisconnect(cfg.type)}
                      className="text-[11px] text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                    >
                      {isDisconnecting ? t("disconnecting_status") : t("disconnect_btn")}
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => onSelectStage(cfg.stageIndex)}
                    className="w-full py-1.5 rounded-xl text-xs font-semibold border border-dashed border-border hover:border-primary/50 text-foreground hover:bg-card transition-all cursor-pointer text-center"
                  >
                    {t("summary_connect_action")}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Connected Count & Warning */}
      {connectedCount === 0 ? (
        <div className="p-4 rounded-2xl alert-warning border flex items-start gap-3 text-xs leading-relaxed">
          <span className="text-base shrink-0 mt-0.5">⚠️</span>
          <div className="flex-1">
            <p className="font-bold text-amber-900 dark:text-amber-200 mb-1">
              {t("at_least_one_hint")}
            </p>
            <p className="text-amber-800/90 dark:text-amber-300/90 leading-relaxed">
              {t("summary_no_channels_warning")}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {t("connected_count", { count: connectedCount })}
          </span>
        </div>
      )}

      {/* Footer Hint */}
      <p className="text-center text-[11px] text-muted-foreground">
        {t("footer_hint")}
      </p>

      {/* Final CTA */}
      <motion.button
        type="button"
        onClick={onContinue}
        disabled={connectedCount === 0 || continueLoading}
        whileTap={connectedCount > 0 ? { scale: 0.98 } : undefined}
        className="w-full py-3.5 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 hover:from-indigo-700 hover:to-violet-700 shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
      >
        {continueLoading ? (
          <>
            <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            <span>{t("continue_loading")}</span>
          </>
        ) : (
          <>
            <span>{t("btn_finish_to_qualification")}</span>
          </>
        )}
      </motion.button>
    </div>
  );
}
