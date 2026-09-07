"use client";

import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { useTranslations } from "next-intl";
import { ChannelType, ChannelStatus } from "@/types/channels";

interface ChannelCardProps {
  type: ChannelType;
  status: ChannelStatus | "IDLE";
  /** Display name shown in the card header */
  title: string;
  /** Short description */
  description: string;
  /** Emoji or icon element */
  icon: React.ReactNode;
  /** Badge text shown in top-right corner */
  badge?: string;
  /** CSS class for badge */
  badgeClass?: string;
  /** Color accent class for hover border, e.g. hover:border-emerald-500/50 */
  accentHoverClass?: string;
  /** Button style when not yet connected */
  connectBtnClass?: string;
  /** Extra metadata line shown when connected (e.g. bot username, phone number) */
  connectedDetail?: string;
  /** Whether a connection action is in progress for THIS card */
  connecting?: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}

const statusConfig: Record<
  ChannelStatus | "IDLE",
  { label: string; dot: string }
> = {
  IDLE: { label: "status_not_connected", dot: "bg-slate-400" },
  PENDING: { label: "status_connecting", dot: "bg-amber-400 animate-pulse" },
  CONNECTED: { label: "status_connected", dot: "bg-emerald-500" },
  DISCONNECTED: { label: "status_not_connected", dot: "bg-slate-400" },
  ERROR: { label: "status_error", dot: "bg-red-500" },
  REVOKED: { label: "status_error", dot: "bg-red-500" },
};

export function ChannelCard({
  type,
  status,
  title,
  description,
  icon,
  badge,
  badgeClass,
  accentHoverClass = "hover:border-indigo-500/50",
  connectBtnClass,
  connectedDetail,
  connecting = false,
  onConnect,
  onDisconnect,
}: ChannelCardProps) {
  const t = useTranslations("onboarding.channel");
  const cfg = statusConfig[status] ?? statusConfig.IDLE;
  const isConnected = status === "CONNECTED";

  return (
    <motion.div
      layout
      className={`relative p-5 rounded-2xl bg-card border border-border flex flex-col gap-4 shadow-xs transition-colors duration-200 ${accentHoverClass} ${isConnected ? "border-emerald-500/40 bg-emerald-500/[0.03]" : ""}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 28 }}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="text-3xl leading-none">{icon}</div>
          <div>
            <h4 className="font-bold text-foreground text-sm leading-tight">
              {title}
            </h4>
            <p className="text-muted-foreground text-xs mt-0.5 leading-relaxed">
              {description}
            </p>
          </div>
        </div>
        {badge && (
          <span
            className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold border ${badgeClass}`}
          >
            {badge}
          </span>
        )}
      </div>

      {/* Status row */}
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
        <span className="text-xs text-muted-foreground">{t(cfg.label)}</span>
        <AnimatePresence>
          {isConnected && connectedDetail && (
            <motion.span
              key="detail"
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="text-xs font-medium text-emerald-700 dark:text-emerald-400 ml-1"
            >
              · {connectedDetail}
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Action button */}
      <AnimatePresence mode="wait">
        {isConnected ? (
          <motion.button
            key="disconnect"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            type="button"
            onClick={onDisconnect}
            disabled={connecting}
            className="w-full py-2 text-xs font-semibold text-muted-foreground border border-border rounded-xl hover:border-red-400/50 hover:text-red-500 hover:bg-red-500/5 transition-all disabled:opacity-50 cursor-pointer"
          >
            {t("disconnect_btn")}
          </motion.button>
        ) : (
          <motion.button
            key="connect"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            type="button"
            onClick={onConnect}
            disabled={connecting}
            className={`w-full py-2.5 text-xs font-bold rounded-xl transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 ${connectBtnClass}`}
          >
            {connecting ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                <span>{t("status_connecting")}</span>
              </>
            ) : (
              <>
                <span>{t(`${type.toLowerCase()}_connect_btn` as Parameters<typeof t>[0])}</span>
                <span>→</span>
              </>
            )}
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
