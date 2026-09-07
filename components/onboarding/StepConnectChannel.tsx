"use client";

import React, { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useTranslations } from "next-intl";
import { FadeIn } from "@/components/ui/motion/FadeIn";
import { ChannelCard } from "@/components/onboarding/channel/ChannelCard";
import { TelegramFlow } from "@/components/onboarding/channel/TelegramFlow";
import { WhatsAppFlow } from "@/components/onboarding/channel/WhatsAppFlow";
import { InstagramFlow } from "@/components/onboarding/channel/InstagramFlow";
import { listChannels, disconnectChannel } from "@/lib/api/channels";
import {
  ChannelType,
  ChannelStatus,
  WhatsAppChannelMetadata,
  InstagramChannelMetadata,
  TelegramChannelMetadata,
} from "@/types/channels";

interface ConnectedChannel {
  status: ChannelStatus;
  detail?: string;
}

type ActiveFlow = ChannelType | null;

interface StepConnectChannelProps {
  /** Called when user clicks "Continue" after connecting ≥1 channel */
  onContinue: () => void;
  continueLoading: boolean;
}

export function StepConnectChannel({
  onContinue,
  continueLoading,
}: StepConnectChannelProps) {
  const t = useTranslations("onboarding.channel");

  const [channels, setChannels] = useState<
    Partial<Record<ChannelType, ConnectedChannel>>
  >({});
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [activeFlow, setActiveFlow] = useState<ActiveFlow>(null);
  const [disconnecting, setDisconnecting] = useState<ChannelType | null>(null);

  // ---------------------------------------------------------------------------
  // Load existing channel statuses on mount
  // ---------------------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await listChannels();
        if (cancelled) return;
        const map: Partial<Record<ChannelType, ConnectedChannel>> = {};
        for (const ch of res.channels) {
          map[ch.type] = {
            status: ch.status,
            detail: resolveDetail(ch.type, ch.metadata),
          };
        }
        setChannels(map);
      } catch {
        // Non-fatal — proceed without pre-filled statuses
      } finally {
        if (!cancelled) setLoadingStatus(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------
  const resolveDetail = (
    type: ChannelType,
    metadata: unknown
  ): string | undefined => {
    if (!metadata || typeof metadata !== "object") return undefined;
    const m = metadata as Record<string, unknown>;
    if (type === "WHATSAPP") {
      return (m as unknown as WhatsAppChannelMetadata).displayPhoneNumber ?? undefined;
    }
    if (type === "INSTAGRAM") {
      const ig = m as unknown as InstagramChannelMetadata;
      return ig.igUsername ? `@${ig.igUsername}` : undefined;
    }
    if (type === "TELEGRAM") {
      const tg = m as unknown as TelegramChannelMetadata;
      return tg.botUsername ? `@${tg.botUsername}` : undefined;
    }
    return undefined;
  };

  const markConnected = useCallback(
    (type: ChannelType, detail?: string) => {
      setChannels((prev) => ({
        ...prev,
        [type]: { status: "CONNECTED" as ChannelStatus, detail },
      }));
      setActiveFlow(null);
    },
    []
  );

  const handleDisconnect = async (type: ChannelType) => {
    try {
      setDisconnecting(type);
      await disconnectChannel(type);
      setChannels((prev) => {
        const next = { ...prev };
        delete next[type];
        return next;
      });
    } catch {
      // Toast is shown by the global error handler
    } finally {
      setDisconnecting(null);
    }
  };

  const connectedCount = Object.values(channels).filter(
    (c) => c?.status === "CONNECTED"
  ).length;

  const isConnected = (type: ChannelType): boolean =>
    channels[type]?.status === "CONNECTED";

  const getStatus = (type: ChannelType): ChannelStatus | "IDLE" =>
    channels[type]?.status ?? "IDLE";

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* Loading skeleton */}
      {loadingStatus && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-52 rounded-2xl bg-card border border-border animate-pulse"
            />
          ))}
        </div>
      )}

      {/* Channel cards */}
      {!loadingStatus && (
        <FadeIn delay={0.05}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* WhatsApp */}
            <div className="flex flex-col gap-3">
              <ChannelCard
                type="WHATSAPP"
                status={getStatus("WHATSAPP")}
                title={t("whatsapp_title")}
                description={t("whatsapp_desc")}
                icon="💬"
                badge={t("recommended_badge")}
                badgeClass="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                accentHoverClass="hover:border-emerald-500/50"
                connectBtnClass="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30"
                connectedDetail={channels.WHATSAPP?.detail}
                connecting={false}
                onConnect={() =>
                  setActiveFlow(activeFlow === "WHATSAPP" ? null : "WHATSAPP")
                }
                onDisconnect={() => handleDisconnect("WHATSAPP")}
              />
              <AnimatePresence>
                {activeFlow === "WHATSAPP" && !isConnected("WHATSAPP") && (
                  <WhatsAppFlow
                    onSuccess={(meta) =>
                      markConnected("WHATSAPP", meta.displayPhoneNumber)
                    }
                    onCancel={() => setActiveFlow(null)}
                  />
                )}
              </AnimatePresence>
            </div>

            {/* Instagram */}
            <div className="flex flex-col gap-3">
              <ChannelCard
                type="INSTAGRAM"
                status={getStatus("INSTAGRAM")}
                title={t("instagram_title")}
                description={t("instagram_desc")}
                icon="📸"
                badge={t("direct_badge")}
                badgeClass="bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/20"
                accentHoverClass="hover:border-purple-500/50"
                connectBtnClass="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-md"
                connectedDetail={channels.INSTAGRAM?.detail}
                connecting={false}
                onConnect={() =>
                  setActiveFlow(activeFlow === "INSTAGRAM" ? null : "INSTAGRAM")
                }
                onDisconnect={() => handleDisconnect("INSTAGRAM")}
              />
              <AnimatePresence>
                {activeFlow === "INSTAGRAM" && !isConnected("INSTAGRAM") && (
                  <InstagramFlow
                    onSuccess={(meta) =>
                      markConnected(
                        "INSTAGRAM",
                        meta.igUsername ? `@${meta.igUsername}` : undefined
                      )
                    }
                    onCancel={() => setActiveFlow(null)}
                  />
                )}
              </AnimatePresence>
            </div>

            {/* Telegram */}
            <div className="flex flex-col gap-3">
              <ChannelCard
                type="TELEGRAM"
                status={getStatus("TELEGRAM")}
                title={t("telegram_title")}
                description={t("telegram_desc")}
                icon="✈️"
                badge={t("telegram_badge")}
                badgeClass="bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20"
                accentHoverClass="hover:border-sky-500/50"
                connectBtnClass="bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 dark:text-sky-400 border border-sky-500/30"
                connectedDetail={channels.TELEGRAM?.detail}
                connecting={disconnecting === "TELEGRAM"}
                onConnect={() =>
                  setActiveFlow(activeFlow === "TELEGRAM" ? null : "TELEGRAM")
                }
                onDisconnect={() => handleDisconnect("TELEGRAM")}
              />
              <AnimatePresence>
                {activeFlow === "TELEGRAM" && !isConnected("TELEGRAM") && (
                  <TelegramFlow
                    onSuccess={(meta) =>
                      markConnected(
                        "TELEGRAM",
                        meta.botUsername ? `@${meta.botUsername}` : undefined
                      )
                    }
                    onCancel={() => setActiveFlow(null)}
                  />
                )}
              </AnimatePresence>
            </div>
          </div>
        </FadeIn>
      )}

      {/* Connected count badge */}
      <AnimatePresence>
        {connectedCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center justify-center gap-2"
          >
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              {t("connected_count", { count: connectedCount })}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer hint */}
      <FadeIn delay={0.2} className="text-center">
        <p className="text-[11px] text-muted-foreground">
          {t("footer_hint")}
        </p>
      </FadeIn>

      {/* Continue CTA */}
      <FadeIn delay={0.25}>
        <motion.button
          type="button"
          onClick={onContinue}
          disabled={connectedCount === 0 || continueLoading}
          whileTap={connectedCount > 0 ? { scale: 0.97 } : undefined}
          className="w-full py-3 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
        >
          {continueLoading ? (
            <>
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              <span>{t("continue_loading")}</span>
            </>
          ) : (
            <>
              <span>{t("continue_btn")}</span>
              <span>→</span>
            </>
          )}
        </motion.button>

        {connectedCount === 0 && (
          <p className="text-center text-[11px] text-muted-foreground mt-2">
            {t("at_least_one_hint")}
          </p>
        )}
      </FadeIn>
    </div>
  );
}
