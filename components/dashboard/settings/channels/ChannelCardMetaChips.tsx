"use client";

import React from "react";
import { ShieldCheck, ExternalLink } from "lucide-react";
import { useTranslations } from "next-intl";
import type {
  WhatsAppChannelMetadata,
  InstagramChannelMetadata,
  TelegramChannelMetadata,
} from "@/types/channels";

interface ChannelCardMetaChipsProps {
  waMeta?: WhatsAppChannelMetadata | null;
  igMeta?: InstagramChannelMetadata | null;
  tgMeta?: TelegramChannelMetadata | null;
}

export function ChannelCardMetaChips({
  waMeta,
  igMeta,
  tgMeta,
}: ChannelCardMetaChipsProps) {
  const t = useTranslations("dashboard.integrations");

  const qualityRating = waMeta?.qualityRating?.toUpperCase();
  const isVerified = waMeta?.codeVerificationStatus === "VERIFIED";

  return (
    <div className="mt-3.5 pt-3 border-t border-border/50 flex items-center justify-between gap-3 flex-wrap text-xs text-muted-foreground">
      {/* WhatsApp Extended Specs */}
      {waMeta && (
        <div className="flex items-center gap-2 flex-wrap">
          {qualityRating && (
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                qualityRating === "GREEN"
                  ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                  : qualityRating === "YELLOW"
                  ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                  : "bg-rose-500/10 text-rose-600 border-rose-500/20"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  qualityRating === "GREEN"
                    ? "bg-emerald-500"
                    : qualityRating === "YELLOW"
                    ? "bg-amber-500"
                    : "bg-rose-500"
                }`}
              />
              <span>
                {qualityRating === "GREEN"
                  ? t("quality_green")
                  : qualityRating === "YELLOW"
                  ? t("quality_yellow")
                  : t("quality_red")}
              </span>
            </span>
          )}

          {isVerified && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full">
              <ShieldCheck className="w-3 h-3" />
              <span>{t("code_verified")}</span>
            </span>
          )}

          {waMeta.wabaId && (
            <span className="font-mono text-[11px] bg-muted/50 px-2 py-0.5 rounded-md border border-border/60">
              {t("waba_id_label")}: {waMeta.wabaId}
            </span>
          )}

          {waMeta.phoneNumberId && (
            <span className="font-mono text-[11px] bg-muted/50 px-2 py-0.5 rounded-md border border-border/60">
              {t("phone_id_label")}: {waMeta.phoneNumberId}
            </span>
          )}
        </div>
      )}

      {/* Instagram Extended Specs */}
      {igMeta && (
        <div className="flex items-center gap-2 flex-wrap">
          {igMeta.instagramId && (
            <span className="font-mono text-[11px] bg-muted/50 px-2 py-0.5 rounded-md border border-border/60">
              {t("account_id_label")}: {igMeta.instagramId}
            </span>
          )}
          {igMeta.igUsername && (
            <a
              href={`https://instagram.com/${igMeta.igUsername.replace(/^@/, "")}`}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-1 text-[11px] text-pink-600 dark:text-pink-400 hover:underline"
            >
              <span>instagram.com/{igMeta.igUsername.replace(/^@/, "")}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      )}

      {/* Telegram Extended Specs */}
      {tgMeta && (
        <div className="flex items-center gap-2 flex-wrap">
          {tgMeta.botId && (
            <span className="font-mono text-[11px] bg-muted/50 px-2 py-0.5 rounded-md border border-border/60">
              {t("bot_id_label")}: {tgMeta.botId}
            </span>
          )}
          {tgMeta.botUsername && (
            <a
              href={`https://t.me/${tgMeta.botUsername.replace(/^@/, "")}`}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-1 text-[11px] text-sky-600 dark:text-sky-400 hover:underline"
            >
              <span>{t("open_in_telegram")}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      )}
    </div>
  );
}
