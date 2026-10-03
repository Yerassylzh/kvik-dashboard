"use client";

import React from "react";
import {
  CheckCircle2,
  AlertCircle,
  XCircle,
  RefreshCw,
  PowerOff,
  Plus,
  Clock,
  ExternalLink,
} from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { ChannelIcon } from "@/components/ui/channel-icon";
import { EntityAvatar } from "@/components/dashboard/shared/EntityAvatar";
import { WhatsAppFlow } from "@/components/onboarding/channel/WhatsAppFlow";
import { InstagramFlow } from "@/components/onboarding/channel/InstagramFlow";
import { TelegramFlow } from "@/components/onboarding/channel/TelegramFlow";
import { ChannelCardMetaChips } from "./ChannelCardMetaChips";
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

interface ExpiryInfo {
  text: string;
  isExpiringSoon: boolean;
  isExpired: boolean;
}

function resolveTokenExpiry(
  dateStr?: string | null,
  locale: string = "en",
  t?: (key: string, values?: Record<string, string | number>) => string
): ExpiryInfo | null {
  if (!dateStr) return null;
  const expiryDate = new Date(dateStr);
  if (isNaN(expiryDate.getTime())) return null;

  const now = new Date();
  const diffMs = expiryDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) {
    return {
      text: t ? t("channels.token_expired") : "Token expired",
      isExpiringSoon: true,
      isExpired: true,
    };
  }
  if (diffDays <= 7) {
    return {
      text: t ? t("channels.token_expires_in", { days: diffDays }) : `Expires in ${diffDays} d.`,
      isExpiringSoon: true,
      isExpired: false,
    };
  }
  const dateLocale = locale === "ru" ? "ru-RU" : locale === "kk" ? "kk-KZ" : "en-US";
  const formattedDate = expiryDate.toLocaleDateString(dateLocale, {
    day: "numeric",
    month: "short",
  });
  return {
    text: t ? t("channels.token_valid_until", { date: formattedDate }) : `Valid until ${formattedDate}`,
    isExpiringSoon: false,
    isExpired: false,
  };
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
  const locale = useLocale();

  const isConnected = channel?.status === "CONNECTED";
  const isError = channel?.status === "ERROR" || channel?.status === "REVOKED";
  const detail = channel ? resolveDetail(config.type, channel.metadata) : null;
  const expiry = isConnected ? resolveTokenExpiry(channel?.tokenExpiresAt, locale, t) : null;

  const waMeta = config.type === "WHATSAPP" && isConnected ? (channel?.metadata as WhatsAppChannelMetadata) : null;
  const igMeta = config.type === "INSTAGRAM" && isConnected ? (channel?.metadata as InstagramChannelMetadata) : null;
  const tgMeta = config.type === "TELEGRAM" && isConnected ? (channel?.metadata as TelegramChannelMetadata) : null;

  return (
    <div className="flex flex-col p-4 sm:p-5 rounded-2xl bg-card border border-border/70 hover:border-border transition-all shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left: Icon / Avatar & Identifiers */}
        <div className="flex items-start sm:items-center gap-3.5 min-w-0">
          {igMeta ? (
            <div className="relative shrink-0">
              <EntityAvatar
                src={igMeta.profilePictureUrl}
                name={igMeta.name || igMeta.igUsername || "Instagram"}
                size="md"
                className="w-12 h-12 rounded-full ring-2 ring-pink-500/20 shadow-xs object-cover"
              />
              <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-600 text-white flex items-center justify-center shadow-xs">
                <ChannelIcon type="INSTAGRAM" className="w-2.5 h-2.5" />
              </span>
            </div>
          ) : (
            <div className={`p-3 rounded-xl ${config.bg} ${config.color} shrink-0`}>
              <ChannelIcon type={config.type} className="w-5 h-5" />
            </div>
          )}

          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-bold text-sm text-foreground truncate">
                {igMeta?.name
                  ? igMeta.name
                  : t(config.titleKey as Parameters<typeof t>[0])}
              </h4>

              {isConnected ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>{t("channels.status_connected")}</span>
                </span>
              ) : isError ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-destructive bg-destructive/10 border border-destructive/20 px-2 py-0.5 rounded-full">
                  <AlertCircle className="w-3 h-3" />
                  <span>{t("channels.status_error")}</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground bg-muted/60 border border-border/60 px-2 py-0.5 rounded-full">
                  <XCircle className="w-3 h-3" />
                  <span>{t("channels.status_disconnected")}</span>
                </span>
              )}

              {expiry && expiry.isExpiringSoon && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                  <Clock className="w-3 h-3" />
                  <span>{expiry.text}</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
              {igMeta?.igUsername ? (
                <a
                  href={`https://instagram.com/${igMeta.igUsername.replace(/^@/, "")}`}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-1 font-semibold text-pink-600 dark:text-pink-400 hover:underline"
                >
                  <span>@{igMeta.igUsername.replace(/^@/, "")}</span>
                  <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                </a>
              ) : (
                <span className="font-mono tabular-nums text-foreground/90 font-medium truncate">
                  {detail || (isConnected ? t("channels.last_synced") : t("channels.not_configured"))}
                </span>
              )}

              {igMeta ? (
                <>
                  <span className="text-border">•</span>
                  <span className="text-[11px] text-muted-foreground/90">
                    {t(config.titleKey as Parameters<typeof t>[0])}
                  </span>
                </>
              ) : null}

              {waMeta?.verifiedName && waMeta.displayPhoneNumber && (
                <>
                  <span className="text-border">•</span>
                  <span className="truncate">{waMeta.verifiedName}</span>
                </>
              )}

              {tgMeta?.botFirstName && tgMeta.botUsername && (
                <>
                  <span className="text-border">•</span>
                  <span className="truncate">{tgMeta.botFirstName}</span>
                </>
              )}

              {expiry && !expiry.isExpiringSoon && (
                <>
                  <span className="text-border">•</span>
                  <span className="text-[11px] text-muted-foreground/80">{expiry.text}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
          {isConnected ? (
            <>
              {expiry?.isExpiringSoon && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onStartConnect(config.type)}
                  className="text-xs h-8 border-amber-500/30 text-amber-700 dark:text-amber-400 hover:bg-amber-500/10"
                >
                  {t("channels.extend_access_btn")}
                </Button>
              )}
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
                className="text-xs h-8 border-border/70"
              >
                {t("channels.check_btn")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDisconnect(config.type)}
                loading={isDisconnecting}
                leftIcon={<PowerOff className="w-3.5 h-3.5 text-destructive" />}
                className="text-xs h-8 border-border/70 hover:bg-destructive/10 hover:border-destructive/30 text-destructive"
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
              {isError ? t("channels.reconnect_btn") : t("channels.connect_btn")}
            </Button>
          )}
        </div>
      </div>

      {/* Rich Metadata Sub-panel for Connected State */}
      {isConnected && (
        <ChannelCardMetaChips
          waMeta={waMeta}
          igMeta={igMeta}
          tgMeta={tgMeta}
        />
      )}

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
