"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  CheckCircle2,
  AlertCircle,
  XCircle,
  RefreshCw,
  PowerOff,
  Plus,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { SectionCard } from "@/components/dashboard/shared/SectionCard";
import { Button } from "@/components/ui/button";
import { ChannelIcon } from "@/components/ui/channel-icon";
import {
  listChannels,
  disconnectChannel,
  checkChannelHealth,
} from "@/lib/api/channels";
import { WhatsAppFlow } from "@/components/onboarding/channel/WhatsAppFlow";
import { InstagramFlow } from "@/components/onboarding/channel/InstagramFlow";
import { TelegramFlow } from "@/components/onboarding/channel/TelegramFlow";
import type {
  Channel,
  ChannelType,
  WhatsAppChannelMetadata,
  InstagramChannelMetadata,
  TelegramChannelMetadata,
} from "@/types/channels";

interface ChannelConfig {
  type: ChannelType;
  titleKey: string;
  color: string;
  bg: string;
}

const CHANNEL_CONFIGS: ChannelConfig[] = [
  {
    type: "WHATSAPP",
    titleKey: "channels.whatsapp_name",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
  {
    type: "INSTAGRAM",
    titleKey: "channels.instagram_name",
    color: "text-pink-500",
    bg: "bg-pink-500/10",
  },
  {
    type: "TELEGRAM",
    titleKey: "channels.telegram_name",
    color: "text-sky-500",
    bg: "bg-sky-500/10",
  },
];

function resolveDetail(type: ChannelType, metadata: unknown): string | undefined {
  if (!metadata || typeof metadata !== "object") return undefined;
  const m = metadata as Record<string, unknown>;
  if (type === "WHATSAPP") {
    const wa = m as unknown as WhatsAppChannelMetadata;
    return wa.displayPhoneNumber || wa.verifiedName || undefined;
  }
  if (type === "INSTAGRAM") {
    const ig = m as unknown as InstagramChannelMetadata;
    if (ig.igUsername) return `@${ig.igUsername.replace(/^@/, "")}`;
    return ig.name || ig.pageName || undefined;
  }
  if (type === "TELEGRAM") {
    const tg = m as unknown as TelegramChannelMetadata;
    return tg.botUsername ? `@${tg.botUsername.replace(/^@/, "")}` : tg.botFirstName || undefined;
  }
  return undefined;
}

export function ChannelsManager() {
  const t = useTranslations("dashboard");
  const tChannels = useTranslations("channels");
  const tCommon = useTranslations("common");

  const [channelMap, setChannelMap] = useState<Partial<Record<ChannelType, Channel>>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [checkingType, setCheckingType] = useState<ChannelType | null>(null);
  const [disconnectingType, setDisconnectingType] = useState<ChannelType | null>(null);
  const [activeConnectingType, setActiveConnectingType] = useState<ChannelType | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(
    null
  );

  const fetchChannels = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await listChannels();
      const map: Partial<Record<ChannelType, Channel>> = {};
      for (const ch of res.channels) {
        map[ch.type] = ch;
      }
      setChannelMap(map);
    } catch {
      // Handled globally
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChannels();
  }, [fetchChannels]);

  const handleCheckHealth = async (type: ChannelType) => {
    setCheckingType(type);
    setFeedback(null);
    try {
      const res = await checkChannelHealth(type);
      if (res.isHealthy) {
        setFeedback({
          type: "success",
          message: t("channels.refresh_success"),
        });
      } else {
        setFeedback({
          type: "error",
          message: t("channels.refresh_error"),
        });
      }
      await fetchChannels();
    } catch {
      setFeedback({
        type: "error",
        message: t("channels.refresh_error"),
      });
    } finally {
      setCheckingType(null);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  const handleDisconnect = async (type: ChannelType) => {
    setDisconnectingType(type);
    setFeedback(null);
    try {
      await disconnectChannel(type);
      setChannelMap((prev) => {
        const next = { ...prev };
        delete next[type];
        return next;
      });
      setFeedback({
        type: "success",
        message: tChannels("channel_disconnected"),
      });
    } catch {
      // Handled globally
    } finally {
      setDisconnectingType(null);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  const handleConnectSuccess = async (type: ChannelType) => {
    setActiveConnectingType(null);
    const msg =
      type === "WHATSAPP"
        ? tChannels("whatsapp_connected")
        : type === "INSTAGRAM"
        ? tChannels("instagram_connected")
        : tChannels("telegram_connected");
    setFeedback({
      type: "success",
      message: msg,
    });
    await fetchChannels();
    setTimeout(() => setFeedback(null), 5000);
  };

  return (
    <SectionCard
      title={t("channels.title")}
      description={t("channels.description")}
      className="max-w-4xl"
    >
      <div className="space-y-3 pt-2">
        {feedback && (
          <div
            className={`p-3 rounded-xl border text-xs flex items-center gap-2 animate-in fade-in ${
              feedback.type === "success"
                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                : "alert-destructive border"
            }`}
          >
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 rounded-2xl bg-muted/40 animate-pulse" />
            ))}
          </div>
        ) : (
          CHANNEL_CONFIGS.map((cfg) => {
            const channel = channelMap[cfg.type];
            const isConnected = channel?.status === "CONNECTED";
            const isError = channel?.status === "ERROR";
            const isChecking = checkingType === cfg.type;
            const isDisconnecting = disconnectingType === cfg.type;
            const isConnecting = activeConnectingType === cfg.type;

            const detail = channel ? resolveDetail(cfg.type, channel.metadata) : null;

            return (
              <div
                key={cfg.type}
                className="flex flex-col p-4 rounded-2xl bg-card border border-border/60 hover:border-border transition-colors"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className={`p-3 rounded-xl ${cfg.bg} ${cfg.color} shrink-0`}>
                      <ChannelIcon type={cfg.type} className="w-5 h-5" />
                    </div>

                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-sm text-foreground truncate">
                          {t(cfg.titleKey as any)}
                        </h4>

                        {isConnected ? (
                          <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>{t("channels.status_connected")}</span>
                          </span>
                        ) : isError ? (
                          <span className="flex items-center gap-1 text-[11px] font-semibold text-destructive bg-destructive/10 border border-destructive/20 px-2 py-0.5 rounded-full">
                            <AlertCircle className="w-3 h-3" />
                            <span>{t("channels.status_error")}</span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground bg-muted/60 border border-border/60 px-2 py-0.5 rounded-full">
                            <XCircle className="w-3 h-3" />
                            <span>{t("channels.status_disconnected")}</span>
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-muted-foreground truncate font-mono">
                        {detail || (isConnected ? t("channels.last_synced") : t("channels.not_configured"))}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isConnected ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCheckHealth(cfg.type)}
                          loading={isChecking}
                          leftIcon={<RefreshCw className={`w-3.5 h-3.5 text-muted-foreground ${isChecking ? "animate-spin" : ""}`} />}
                          className="text-xs h-8 border-border/60"
                        >
                          {t("channels.check_btn")}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDisconnect(cfg.type)}
                          loading={isDisconnecting}
                          leftIcon={<PowerOff className="w-3.5 h-3.5 text-destructive" />}
                          className="text-xs h-8 border-border/60 hover:bg-destructive/10 hover:border-destructive/30 text-destructive"
                        >
                          {t("channels.disconnect_btn")}
                        </Button>
                      </>
                    ) : isConnecting ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setActiveConnectingType(null)}
                        className="text-xs h-8 text-muted-foreground hover:text-foreground"
                      >
                        {tCommon("cancel")}
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setActiveConnectingType(cfg.type)}
                        leftIcon={<Plus className="w-3.5 h-3.5 text-primary" />}
                        className="text-xs h-8 border-primary/30 text-primary hover:bg-primary/5"
                      >
                        {t("channels.connect_btn")}
                      </Button>
                    )}
                  </div>
                </div>

                {/* In-place Connection Flow */}
                {isConnecting && (
                  <div className="pt-2 border-t border-border/40 mt-3">
                    {cfg.type === "WHATSAPP" && (
                      <WhatsAppFlow
                        onSuccess={(meta) => handleConnectSuccess("WHATSAPP")}
                        onCancel={() => setActiveConnectingType(null)}
                      />
                    )}
                    {cfg.type === "INSTAGRAM" && (
                      <InstagramFlow
                        onSuccess={(meta) => handleConnectSuccess("INSTAGRAM")}
                        onCancel={() => setActiveConnectingType(null)}
                      />
                    )}
                    {cfg.type === "TELEGRAM" && (
                      <TelegramFlow
                        onSuccess={(meta) => handleConnectSuccess("TELEGRAM")}
                        onCancel={() => setActiveConnectingType(null)}
                      />
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </SectionCard>
  );
}
