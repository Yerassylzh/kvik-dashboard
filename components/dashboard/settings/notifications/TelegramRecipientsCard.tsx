"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import useSWR from "swr";
import { useTranslations } from "next-intl";
import {
  Send,
  Trash2,
  ExternalLink,
  RefreshCw,
  CheckCircle,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import clsx from "clsx";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  notificationRecipientsApi,
  type TelegramRecipient,
} from "@/lib/api/notificationRecipients";
import { useRBAC } from "@/hooks/useRBAC";

const ALL_NOTIFICATION_TYPES = [
  { key: "escalation", labelKey: "settings.notifications.type_escalation" },
  { key: "new_booking", labelKey: "settings.notifications.type_booking" },
  { key: "booking_cancelled", labelKey: "settings.notifications.type_booking_cancelled" },
  { key: "takeover", labelKey: "settings.notifications.type_takeover" },
  { key: "takeover_released", labelKey: "settings.notifications.type_takeover_released" },
] as const;

const POLL_INTERVAL_MS = 3000;
const POLL_MAX_DURATION_MS = 120_000;

export function TelegramRecipientsCard() {
  const t = useTranslations("dashboard");
  const { isAdminOrOwner } = useRBAC();

  const {
    data: recipients,
    isLoading,
    mutate,
  } = useSWR<TelegramRecipient[]>("telegram-recipients", notificationRecipientsApi.getRecipients, {
    revalidateOnFocus: false,
  });

  const [isConnecting, setIsConnecting] = useState(false);
  const [countdown, setCountdown] = useState<number>(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevCountRef = useRef<number>(0);
  const pollStartRef = useRef<number>(0);

  const stopPolling = useCallback(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    pollRef.current = null;
    countdownRef.current = null;
    setIsConnecting(false);
    setCountdown(0);
  }, []);

  // Detect new recipient added during polling
  useEffect(() => {
    if (!isConnecting || !recipients) return;
    if (recipients.length > prevCountRef.current) {
      stopPolling();
      toast.success(t("settings.notifications.telegram_connected_toast"));
    }
  }, [recipients, isConnecting, stopPolling, t]);

  const handleConnect = async () => {
    try {
      const { deepLink } = await notificationRecipientsApi.generateTelegramCode();
      window.open(deepLink, "_blank", "noopener,noreferrer");

      prevCountRef.current = recipients?.length ?? 0;
      setIsConnecting(true);
      pollStartRef.current = Date.now();
      setCountdown(POLL_MAX_DURATION_MS / 1000);

      // Countdown timer
      countdownRef.current = setInterval(() => {
        setCountdown((c) => {
          if (c <= 1) {
            stopPolling();
            return 0;
          }
          return c - 1;
        });
      }, 1000);

      // Poll for new recipient
      pollRef.current = setInterval(async () => {
        if (Date.now() - pollStartRef.current > POLL_MAX_DURATION_MS) {
          stopPolling();
          return;
        }
        await mutate();
      }, POLL_INTERVAL_MS);
    } catch {
      toast.error(t("settings.notifications.telegram_connect_error"));
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await notificationRecipientsApi.deleteRecipient(id);
      await mutate();
      toast.success(t("settings.notifications.recipient_deleted_toast"));
    } catch {
      toast.error(t("settings.notifications.recipient_delete_error"));
    }
  };

  const handleToggleType = async (
    recipient: TelegramRecipient,
    typeKey: string,
    checked: boolean
  ) => {
    const updated = checked
      ? [...recipient.notificationTypes, typeKey]
      : recipient.notificationTypes.filter((t) => t !== typeKey);

    try {
      await notificationRecipientsApi.updateRecipient(recipient.id, {
        notificationTypes: updated,
      });
      await mutate();
    } catch {
      toast.error(t("settings.notifications.recipient_update_error"));
    }
  };

  const handleToggleActive = async (recipient: TelegramRecipient) => {
    try {
      await notificationRecipientsApi.updateRecipient(recipient.id, {
        isActive: !recipient.isActive,
      });
      await mutate();
    } catch {
      toast.error(t("settings.notifications.recipient_update_error"));
    }
  };

  if (!isAdminOrOwner) return null;

  return (
    <div className="rounded-xl border border-border/80 bg-card shadow-xs overflow-hidden">
      {/* Card Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border/70">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            {t("settings.notifications.telegram_title")}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t("settings.notifications.telegram_desc")}
          </p>
        </div>

        <Button
          size="sm"
          onClick={handleConnect}
          loading={isConnecting}
          disabled={isConnecting}
          leftIcon={<Send className="w-3.5 h-3.5" />}
          className="text-xs shrink-0"
        >
          {isConnecting
            ? t("settings.notifications.telegram_waiting")
            : t("settings.notifications.telegram_connect_btn")}
        </Button>
      </div>

      {/* Connecting progress */}
      {isConnecting && (
        <div className="px-5 py-3 bg-amber-50/60 border-b border-amber-200/60 flex items-center gap-2.5 text-amber-700">
          <RefreshCw className="w-3.5 h-3.5 animate-spin shrink-0" />
          <p className="text-xs font-medium flex-1">
            {t("settings.notifications.telegram_open_hint")}
          </p>
          <div className="flex items-center gap-1 text-[11px] font-mono tabular-nums text-amber-600 shrink-0">
            <Clock className="w-3 h-3" />
            <span>{countdown}с</span>
          </div>
        </div>
      )}

      {/* Recipients Table */}
      <div className="divide-y divide-border/60">
        {isLoading ? (
          <div className="py-8 text-center text-xs text-muted-foreground">
            {t("common.loading")}
          </div>
        ) : !recipients || recipients.length === 0 ? (
          <div className="py-10 text-center">
            <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-muted-foreground/40" />
            <p className="text-xs text-muted-foreground">
              {t("settings.notifications.no_recipients")}
            </p>
          </div>
        ) : (
          recipients.map((r) => (
            <div key={r.id} className="px-5 py-4 space-y-3">
              {/* Recipient header row */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{r.displayName}</p>
                    <p className="text-[11px] text-muted-foreground font-mono">
                      ID: {r.telegramChatId}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={r.isActive ? "success" : "default"} className="text-[10px] cursor-pointer" >
                    <button type="button" onClick={() => handleToggleActive(r)}>
                      {r.isActive
                        ? t("settings.notifications.recipient_active")
                        : t("settings.notifications.recipient_inactive")}
                    </button>
                  </Badge>

                  <button
                    type="button"
                    onClick={() => handleDelete(r.id)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Notification type checkboxes */}
              <div className="flex flex-wrap gap-2 pl-6">
                {ALL_NOTIFICATION_TYPES.map(({ key, labelKey }) => {
                  const checked = r.notificationTypes.includes(key);
                  return (
                    <label
                      key={key}
                      className={clsx(
                        "flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-medium cursor-pointer select-none transition-colors",
                        checked
                          ? "bg-primary/10 border-primary/30 text-primary"
                          : "bg-muted/40 border-border/60 text-muted-foreground hover:border-border"
                      )}
                    >
                      <input
                        type="checkbox"
                        className="hidden"
                        checked={checked}
                        onChange={(e) => handleToggleType(r, key, e.target.checked)}
                      />
                      {t(labelKey as Parameters<typeof t>[0])}
                    </label>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
