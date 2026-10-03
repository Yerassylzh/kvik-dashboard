"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { SectionCard } from "@/components/dashboard/shared/SectionCard";
import { ConfirmDeleteModal } from "@/components/dashboard/shared/ConfirmDeleteModal";
import {
  listChannels,
  disconnectChannel,
  checkChannelHealth,
} from "@/lib/api/channels";
import { ChannelCard, type ChannelConfig } from "./ChannelCard";
import type { Channel, ChannelType } from "@/types/channels";

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

interface ChannelsManagerProps {
  onChannelsChange?: () => void;
  className?: string;
}

export function ChannelsManager({ onChannelsChange, className }: ChannelsManagerProps = {}) {
  const t = useTranslations("dashboard");
  const tChannels = useTranslations("channels");

  const [channelMap, setChannelMap] = useState<Partial<Record<ChannelType, Channel>>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [checkingType, setCheckingType] = useState<ChannelType | null>(null);
  const [disconnectingType, setDisconnectingType] = useState<ChannelType | null>(null);
  const [confirmDisconnectType, setConfirmDisconnectType] = useState<ChannelType | null>(null);
  const [activeConnectingType, setActiveConnectingType] = useState<ChannelType | null>(null);

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
      // Ignored - empty state handled in UI
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      fetchChannels();
    });
  }, [fetchChannels]);

  const handleCheckHealth = async (type: ChannelType) => {
    setCheckingType(type);
    try {
      const res = await checkChannelHealth(type);
      setChannelMap((prev) => ({
        ...prev,
        [type]: {
          ...prev[type]!,
          status: res.status,
        },
      }));

      const channelTitle = t(
        type === "WHATSAPP"
          ? "channels.whatsapp_name"
          : type === "INSTAGRAM"
          ? "channels.instagram_name"
          : "channels.telegram_name"
      );

      if (res.isHealthy || res.status === "CONNECTED") {
        toast.success(t("channels.refresh_success"), {
          description: `${channelTitle}: ${res.status}`,
        });
      } else {
        toast.warning(t("channels.status_error"), {
          description: `${channelTitle}: ${res.status}`,
        });
      }
    } catch {
      toast.error(tChannels("health_check_failed"));
    } finally {
      setCheckingType(null);
    }
  };

  const handleExecuteDisconnect = async () => {
    if (!confirmDisconnectType) return;
    const type = confirmDisconnectType;
    setDisconnectingType(type);
    try {
      await disconnectChannel(type);
      setChannelMap((prev) => {
        const next = { ...prev };
        delete next[type];
        return next;
      });
      toast.success(tChannels("channel_disconnected"));
      onChannelsChange?.();
    } catch {
      toast.error(tChannels("channel_not_found"));
    } finally {
      setDisconnectingType(null);
      setConfirmDisconnectType(null);
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
    toast.success(msg);
    await fetchChannels();
    onChannelsChange?.();
  };

  return (
    <>
      <SectionCard
        title={t("channels.title")}
        description={t("channels.description")}
        className={className || "max-w-4xl"}
      >
        <div className="space-y-3 pt-2">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 rounded-2xl bg-muted/40 animate-pulse" />
              ))}
            </div>
          ) : (
            CHANNEL_CONFIGS.map((cfg) => (
              <ChannelCard
                key={cfg.type}
                config={cfg}
                channel={channelMap[cfg.type]}
                isChecking={checkingType === cfg.type}
                isDisconnecting={disconnectingType === cfg.type}
                isConnecting={activeConnectingType === cfg.type}
                onCheckHealth={handleCheckHealth}
                onDisconnect={(type) => setConfirmDisconnectType(type)}
                onStartConnect={(type) => setActiveConnectingType(type)}
                onCancelConnect={() => setActiveConnectingType(null)}
                onConnectSuccess={handleConnectSuccess}
              />
            ))
          )}
        </div>
      </SectionCard>

      <ConfirmDeleteModal
        isOpen={confirmDisconnectType !== null}
        onClose={() => setConfirmDisconnectType(null)}
        onConfirm={handleExecuteDisconnect}
        isLoading={disconnectingType !== null}
        title={t("channels.disconnect_btn")}
        description={t("channels.disconnect_confirm")}
        confirmLabel={t("channels.disconnect_btn")}
      />
    </>
  );
}
