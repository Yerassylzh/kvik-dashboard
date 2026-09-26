"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useTranslations } from "next-intl";
import {
  Send,
  Copy,
  Check,
  RefreshCw,
  CheckCircle2,
  ExternalLink,
  Bell,
  Clock,
  ShieldCheck,
} from "lucide-react";
import { FadeIn } from "@/components/ui/motion/FadeIn";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  generateTelegramAlertsCode,
  getTelegramAlertsStatus,
} from "@/lib/api/onboarding";
import { TelegramAlertRecipientDto } from "@/types/niche";

interface StepTelegramAlertsProps {
  onConfirm: () => void;
  onSkip: () => void;
  loading: boolean;
}

const POLL_INTERVAL_MS = 2500;
const POLL_TIMEOUT_MS = 120000;

export function StepTelegramAlerts({
  onConfirm,
  onSkip,
  loading,
}: StepTelegramAlertsProps) {
  const t = useTranslations("onboarding");

  const [code, setCode] = useState<string | null>(null);
  const [deepLink, setDeepLink] = useState<string | null>(null);
  const [codeLoading, setCodeLoading] = useState(true);
  const [codeError, setCodeError] = useState<string | null>(null);

  const [isConnected, setIsConnected] = useState(false);
  const [connectedRecipient, setConnectedRecipient] =
    useState<TelegramAlertRecipientDto | null>(null);
  const [copied, setCopied] = useState(false);

  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollStartRef = useRef<number>(0);

  // ---------------------------------------------------------------------------
  // Generate Code & Link
  // ---------------------------------------------------------------------------
  const fetchCode = useCallback(async () => {
    try {
      setCodeLoading(true);
      setCodeError(null);
      const res = await generateTelegramAlertsCode();
      setCode(res.code);
      setDeepLink(res.deepLink);
    } catch (err) {
      setCodeError(
        err instanceof Error
          ? err.message
          : t("telegram_alerts.error_code")
      );
    } finally {
      setCodeLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchCode();
  }, [fetchCode]);

  // ---------------------------------------------------------------------------
  // Polling for Connection Status
  // ---------------------------------------------------------------------------
  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (isConnected) {
      stopPolling();
      return;
    }

    let cancelled = false;
    pollStartRef.current = Date.now();

    const checkStatus = async () => {
      if (Date.now() - pollStartRef.current > POLL_TIMEOUT_MS) {
        stopPolling();
        return;
      }

      try {
        const res = await getTelegramAlertsStatus();
        if (cancelled) return;

        if (res.connected && res.recipients?.length > 0) {
          setIsConnected(true);
          const active =
            res.recipients.find((r) => r.isActive) || res.recipients[0];
          setConnectedRecipient(active);
          stopPolling();
        }
      } catch {
        // Silent catch for background polling
      }
    };

    checkStatus();
    pollIntervalRef.current = setInterval(checkStatus, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      stopPolling();
    };
  }, [isConnected, stopPolling]);

  // ---------------------------------------------------------------------------
  // Copy Code Handler
  // ---------------------------------------------------------------------------
  const handleCopyCode = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleOpenTelegram = () => {
    if (deepLink) {
      window.open(deepLink, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-5">
      {/* Feature Highlights Row */}
      <FadeIn delay={0.05}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white border border-border/70 text-xs text-foreground font-medium">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
              <Bell className="h-3.5 w-3.5" />
            </span>
            <span className="leading-tight truncate">
              {t("telegram_alerts.feature_escalation")}
            </span>
          </div>

          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white border border-border/70 text-xs text-foreground font-medium">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
              <Clock className="h-3.5 w-3.5" />
            </span>
            <span className="leading-tight truncate">
              {t("telegram_alerts.feature_bookings")}
            </span>
          </div>

          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white border border-border/70 text-xs text-foreground font-medium">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
              <ShieldCheck className="h-3.5 w-3.5" />
            </span>
            <span className="leading-tight truncate">
              {t("telegram_alerts.feature_cancellations")}
            </span>
          </div>
        </div>
      </FadeIn>

      {/* Main Connection Card */}
      <FadeIn delay={0.1}>
        <div className="p-6 sm:p-7 rounded-2xl bg-white border border-border/80 shadow-xs space-y-6">
          {codeLoading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <RefreshCw className="h-5 w-5 text-primary animate-spin" />
              <p className="text-xs text-muted-foreground font-medium">
                {t("telegram_alerts.status_waiting")}
              </p>
            </div>
          ) : codeError ? (
            <div className="text-center py-10 space-y-4">
              <p className="text-xs text-destructive font-medium">{codeError}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchCode}
                className="gap-2"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                {t("telegram_alerts.btn_retry")}
              </Button>
            </div>
          ) : (
            <>
              {/* 2-Column Scannable Layout */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
                {/* Column 1: QR Code */}
                <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-white border border-border/80 text-center space-y-2.5">
                  <span className="text-xs font-semibold text-foreground">
                    {t("telegram_alerts.qr_heading")}
                  </span>

                  <div className="p-2.5 bg-white rounded-lg border border-border/60 shadow-2xs flex items-center justify-center">
                    {deepLink && (
                      <QRCodeSVG
                        value={deepLink}
                        size={150}
                        level="M"
                        marginSize={1}
                        className="rounded"
                      />
                    )}
                  </div>

                  <p className="text-[11px] text-muted-foreground max-w-[190px] leading-tight">
                    {t("telegram_alerts.qr_hint")}
                  </p>
                </div>

                {/* Column 2: Direct CTA & Manual Code */}
                <div className="space-y-4">
                  {/* Option 2: Direct Link */}
                  <div className="space-y-1.5">
                    <span className="block text-xs font-semibold text-foreground">
                      {t("telegram_alerts.direct_heading")}
                    </span>
                    <Button
                      type="button"
                      onClick={handleOpenTelegram}
                      className="w-full h-10 text-xs sm:text-sm font-semibold gap-2 shadow-xs"
                    >
                      <Send className="h-4 w-4" />
                      <span>{t("telegram_alerts.direct_btn")}</span>
                      <ExternalLink className="h-3 w-3 opacity-70" />
                    </Button>
                  </div>

                  <div className="relative flex py-0.5 items-center">
                    <div className="flex-grow border-t border-border/60" />
                    <span className="flex-shrink mx-3 text-[10px] uppercase font-bold text-muted-foreground/80 tracking-wider">
                      или вручную
                    </span>
                    <div className="flex-grow border-t border-border/60" />
                  </div>

                  {/* Option 3: Manual Code */}
                  <div className="space-y-1.5">
                    <span className="block text-xs font-semibold text-foreground">
                      {t("telegram_alerts.manual_heading")}
                    </span>
                    <p className="text-[11px] text-muted-foreground">
                      {t("telegram_alerts.manual_desc")}
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 px-3 py-2 rounded-xl bg-zinc-50 border border-border/80 font-mono text-xs sm:text-sm font-bold text-foreground tracking-wider tabular-nums select-all">
                        {code}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleCopyCode}
                        className="h-9 px-3 gap-1.5 text-xs font-semibold shrink-0"
                      >
                        {copied ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                            <span className="text-emerald-600">
                              {t("telegram_alerts.copied")}
                            </span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" />
                            <span>{t("telegram_alerts.copy_btn")}</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Real-Time Connection Status */}
              <div className="pt-1">
                {isConnected ? (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/80 border border-emerald-200 text-xs text-emerald-900">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      <div>
                        <p className="font-semibold">
                          {t("telegram_alerts.status_connected")}
                        </p>
                        {connectedRecipient && (
                          <p className="text-[11px] text-emerald-700 opacity-90">
                            {t("telegram_alerts.connected_as")}:{" "}
                            <span className="font-medium">
                              {connectedRecipient.displayName ||
                                connectedRecipient.telegramChatId}
                            </span>
                          </p>
                        )}
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className="bg-emerald-100/80 text-emerald-800 border-emerald-300 text-[10px]"
                    >
                      АКТИВНО
                    </Badge>
                  </div>
                ) : (
                  <div className="flex items-center justify-between px-1 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <RefreshCw className="h-3.5 w-3.5 animate-spin text-primary shrink-0" />
                      <span>{t("telegram_alerts.status_waiting")}</span>
                    </div>
                    <span className="text-[11px] font-mono tabular-nums opacity-60">
                      2.5s
                    </span>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Action Buttons Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-border/80">
            <button
              type="button"
              onClick={onSkip}
              disabled={loading}
              className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer disabled:opacity-50"
            >
              {t("telegram_alerts.btn_skip")}
            </button>

            <Button
              type="button"
              onClick={onConfirm}
              loading={loading}
              className="h-10 px-5 font-semibold text-xs sm:text-sm gap-2"
            >
              <span>{t("telegram_alerts.btn_complete")}</span>
            </Button>
          </div>
        </div>
      </FadeIn>
    </div>
  );
}
