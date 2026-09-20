"use client";

import React from "react";
import { Sparkles, MessageSquare, Clock, BookOpen } from "lucide-react";
import { useTranslations } from "next-intl";

export function ColdStartInsightsCard() {
  const t = useTranslations("insights");

  return (
    <div className="p-6 rounded-2xl border border-dashed border-border/90 bg-muted/20 text-center space-y-4 max-w-xl mx-auto my-8">
      <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
        <Sparkles className="w-6 h-6" />
      </div>

      <div className="space-y-1.5">
        <h3 className="text-base font-bold text-foreground">
          {t("cold_start.title")}
        </h3>
        <p className="text-xs text-muted-foreground leading-relaxed max-w-md mx-auto">
          {t("cold_start.desc")}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-left pt-2">
        <div className="p-3 rounded-lg bg-card border border-border/70 space-y-1">
          <div className="flex items-center gap-1.5 text-primary text-xs font-semibold">
            <MessageSquare className="w-3.5 h-3.5 shrink-0" />
            <span>{t("cold_start.card_services_title")}</span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            {t("cold_start.card_services_desc")}
          </p>
        </div>

        <div className="p-3 rounded-lg bg-card border border-border/70 space-y-1">
          <div className="flex items-center gap-1.5 text-amber-600 text-xs font-semibold">
            <Clock className="w-3.5 h-3.5 shrink-0" />
            <span>{t("cold_start.card_peaks_title")}</span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            {t("cold_start.card_peaks_desc")}
          </p>
        </div>

        <div className="p-3 rounded-lg bg-card border border-border/70 space-y-1">
          <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-semibold">
            <BookOpen className="w-3.5 h-3.5 shrink-0" />
            <span>{t("cold_start.card_faq_title")}</span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            {t("cold_start.card_faq_desc")}
          </p>
        </div>
      </div>
    </div>
  );
}
