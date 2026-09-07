"use client";

import React, { useState } from "react";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";

interface ConnectedBadgeCardProps {
  channelName: string;
  icon: string;
  detail?: string;
  badgeLabel?: string;
  onDisconnect: () => Promise<void>;
  disconnecting?: boolean;
  onReconnect?: () => void;
  accentColor?: "emerald" | "purple" | "sky";
}

export function ConnectedBadgeCard({
  channelName,
  icon,
  detail,
  badgeLabel,
  onDisconnect,
  disconnecting = false,
  onReconnect,
  accentColor = "emerald",
}: ConnectedBadgeCardProps) {
  const t = useTranslations("onboarding.channel");
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);

  const getAccentStyles = () => {
    switch (accentColor) {
      case "purple":
        return {
          bg: "bg-purple-500/[0.04]",
          border: "border-purple-500/20",
          iconBg: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
        };
      case "sky":
        return {
          bg: "bg-sky-500/[0.04]",
          border: "border-sky-500/20",
          iconBg: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
        };
      default:
        return {
          bg: "bg-emerald-500/[0.04]",
          border: "border-emerald-500/20",
          iconBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
        };
    }
  };

  const styles = getAccentStyles();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      className={`p-6 rounded-2xl ${styles.bg} border ${styles.border} flex flex-col items-center text-center relative overflow-hidden`}
    >
      {/* Decorative success glow */}
      <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Big Animated Success Icon */}
      <motion.div
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 350, damping: 20 }}
        className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-2xl mb-4 relative shadow-sm"
      >
        <span>{icon}</span>
        <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 text-white text-xs flex items-center justify-center font-bold shadow">
          ✓
        </span>
      </motion.div>

      {/* Success Title */}
      <h4 className="text-base font-bold text-foreground">
        {t("connected_success_title", { channel: channelName })}
      </h4>

      {/* Detail (Phone or Username) */}
      {detail ? (
        <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-card border border-border text-xs font-mono font-semibold text-foreground shadow-xs">
          <span>{detail}</span>
        </div>
      ) : badgeLabel ? (
        <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-card border border-border text-xs font-semibold text-foreground">
          <span>{badgeLabel}</span>
        </div>
      ) : null}

      {/* Status indicator */}
      <div className="mt-3 flex items-center gap-2 text-xs font-medium text-emerald-700 dark:text-emerald-400">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
        <span>{t("connected_ready_status")}</span>
      </div>

      {/* Actions (Disconnect / Reconnect) */}
      <div className="mt-6 flex items-center gap-3">
        {confirmDisconnect ? (
          <div className="flex items-center gap-2 animate-in fade-in">
            <button
              type="button"
              disabled={disconnecting}
              onClick={async () => {
                await onDisconnect();
                setConfirmDisconnect(false);
              }}
              className="px-3 py-1.5 text-xs font-bold rounded-xl alert-destructive border cursor-pointer hover:opacity-80 transition-opacity"
            >
              {disconnecting ? t("disconnecting_status") : "Подтвердить отключение"}
            </button>
            <button
              type="button"
              disabled={disconnecting}
              onClick={() => setConfirmDisconnect(false)}
              className="px-3 py-1.5 text-xs font-medium rounded-xl border border-border text-muted-foreground hover:text-foreground cursor-pointer"
            >
              Отмена
            </button>
          </div>
        ) : (
          <button
            type="button"
            disabled={disconnecting}
            onClick={() => setConfirmDisconnect(true)}
            className="text-xs text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
          >
            {disconnecting ? t("disconnecting_status") : t("disconnect_btn")}
          </button>
        )}

        {onReconnect && !confirmDisconnect && (
          <button
            type="button"
            onClick={onReconnect}
            className="text-xs text-muted-foreground hover:text-primary transition-colors cursor-pointer"
          >
            {t("reconnect_action")}
          </button>
        )}
      </div>
    </motion.div>
  );
}
