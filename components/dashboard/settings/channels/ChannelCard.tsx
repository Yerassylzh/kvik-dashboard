"use client";

import React from "react";
import {
  CheckCircle2,
  AlertCircle,
  XCircle,
  RefreshCw,
  PowerOff,
  Plus,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { ChannelIcon } from "@/components/ui/channel-icon";
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

export interface ChannelConfig {
  type: ChannelType;
  titleKey: string;
  color: string;
  bg: string;
}

export function resolveDetail(type: ChannelType, metadata: unknown): string | undefined {
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

interface ChannelCardProps {
  config: ChannelConfig;
  channel?: Channel;
  isChecking: boolean;
  isDisconnecting: boolean;
  isConnecting: boolean;
  onCheckHealth: (type: ChannelType) => void;
  onDisconnect: (type: ChannelType) => void;
  onStartConnect: (type: ChannelType) => void;
  onCancelConnect: () => void;
  onConnectSuccess: (type: ChannelType) => void;
}

export function ChannelCard({
  config,
  channel,
  isChecking,
  isDisconnecting,
  isConnecting,
  onCheckHealth,
  onDisconnect,
  onStartConnect,
  onCancelConnect,
  onConnectSuccess,
}: ChannelCardProps) {
  const t = useTranslations("dashboard");
  const tCommon = useTranslations("common");

  const isConnected = channel?.status === "CONNECTED";
  const isError = channel?.status === "ERROR";
  const detail = channel ? resolveDetail(config.type, channel.metadata) : null;

  return (
    <div className="flex flex-col p-4 rounded-2xl bg-card border border-border/60 hover:border-border transition-colors">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className={`p-3 rounded-xl ${config.bg} ${config.color} shrink-0`}>
            <ChannelIcon type={config.type} className="w-5 h-5" />
          </div>

          <div className="min-w-0 space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-bold text-sm text-foreground truncate">
                {t(config.titleKey as any)}
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
                onClick={() => onCheckHealth(config.type)}
                loading={isChecking}
                leftIcon={
                  <RefreshCw
                    className={`w-3.5 h-3.5 text-muted-foreground ${
                      isChecking ? "animate-spin" : ""
                    }`}
                  />
                }
                className="text-xs h-8 border-border/60"
              >
                {t("channels.check_btn")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDisconnect(config.type)}
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
              onClick={onCancelConnect}
              className="text-xs h-8 text-muted-foreground hover:text-foreground"
            >
              {tCommon("cancel")}
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onStartConnect(config.type)}
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
          {config.type === "WHATSAPP" && (
            <WhatsAppFlow
              onSuccess={() => onConnectSuccess("WHATSAPP")}
              onCancel={onCancelConnect}
            />
          )}
          {config.type === "INSTAGRAM" && (
            <InstagramFlow
              onSuccess={() => onConnectSuccess("INSTAGRAM")}
              onCancel={onCancelConnect}
            />
          )}
          {config.type === "TELEGRAM" && (
            <TelegramFlow
              onSuccess={() => onConnectSuccess("TELEGRAM")}
              onCancel={onCancelConnect}
            />
          )}
        </div>
      )}
    </div>
  );
}
