"use client";

import React from "react";
import Link from "next/link";
import useSWR from "swr";
import { useTranslations } from "next-intl";
import { Send, ChevronRight } from "lucide-react";
import { FadeIn } from "@/components/ui/motion/FadeIn";
import {
  notificationRecipientsApi,
  type TelegramRecipient,
} from "@/lib/api/notificationRecipients";
import { useRBAC } from "@/hooks/useRBAC";

/**
 * Compact call-to-action banner shown on the Overview page when the user has
 * not connected a personal Telegram chat for alert notifications yet.
 * Clicking anywhere on it opens the notification settings section,
 * where the Telegram connect flow lives.
 */
export function TelegramAlertsBanner() {
  const t = useTranslations("dashboard");
  const { isAdminOrOwner } = useRBAC();

  const { data: recipients } = useSWR<TelegramRecipient[]>(
    "telegram-alerts-banner",
    notificationRecipientsApi.getRecipients,
    { revalidateOnFocus: false }
  );

  const shouldShow =
    isAdminOrOwner && recipients !== undefined && recipients.length === 0;

  if (!shouldShow) return null;

  return (
    <FadeIn direction="up" distance={6} duration={0.25}>
    <Link
      href="/settings/notifications"
      className="group flex items-center justify-between gap-4 rounded-xl border border-border/80 bg-card px-4 py-3.5 shadow-xs transition-colors hover:border-border"
    >
      {/* Left: icon + copy */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0">
          <Send className="w-4.5 h-4.5" />
        </div>
        <div className="min-w-0">
          <h3 className="font-semibold text-sm text-foreground leading-snug">
            {t("telegram_alerts_banner_title")}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {t("telegram_alerts_banner_description")}
          </p>
        </div>
      </div>

      {/* Right: CTA */}
      <span className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold shrink-0 transition-opacity group-hover:opacity-90">
        <Send className="w-3.5 h-3.5" />
        {t("telegram_alerts_banner_cta")}
        <ChevronRight className="w-3.5 h-3.5" />
      </span>
    </Link>
    </FadeIn>
  );
}
