"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { ChannelDto } from "@/types/niche";
import { FadeIn } from "@/components/ui/motion/FadeIn";
import { InteractiveCard } from "@/components/ui/motion/InteractiveCard";

interface StepConnectChannelProps {
  onConnect: (type: ChannelDto["type"]) => void;
  onBack?: () => void;
  loading: boolean;
}

export function StepConnectChannel({
  onConnect,
  onBack,
  loading,
}: StepConnectChannelProps) {
  const t = useTranslations("onboarding");

  return (
    <div className="space-y-6">
      <FadeIn delay={0.05} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* WhatsApp Card */}
        <InteractiveCard
          disabled={loading}
          onClick={() => onConnect("WHATSAPP")}
          className="p-6 rounded-2xl bg-card border border-border flex flex-col justify-between h-52 shadow-xs hover:border-emerald-500/50"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-3xl">💬</span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                {t("channel.recommended_badge")}
              </span>
            </div>
            <h4 className="font-bold text-foreground text-base">
              {t("channel.whatsapp_title")}
            </h4>
            <p className="text-muted-foreground text-xs mt-1.5 leading-relaxed">
              {t("channel.whatsapp_desc")}
            </p>
          </div>
          <button
            type="button"
            disabled={loading}
            className="w-full py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-bold text-xs rounded-xl border border-emerald-500/30 transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
          >
            <span>{t("channel.whatsapp_btn")}</span>
            <span>→</span>
          </button>
        </InteractiveCard>

        {/* Instagram Card */}
        <InteractiveCard
          disabled={loading}
          onClick={() => onConnect("INSTAGRAM")}
          className="p-6 rounded-2xl bg-card border border-border flex flex-col justify-between h-52 shadow-xs hover:border-purple-500/50"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-3xl">📸</span>
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 text-[10px] font-bold border border-indigo-200 dark:border-indigo-500/20">
                {t("channel.direct_badge")}
              </span>
            </div>
            <h4 className="font-bold text-foreground text-base">
              {t("channel.instagram_title")}
            </h4>
            <p className="text-muted-foreground text-xs mt-1.5 leading-relaxed">
              {t("channel.instagram_desc")}
            </p>
          </div>
          <button
            type="button"
            disabled={loading}
            className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold text-xs rounded-xl shadow-md transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
          >
            <span>{t("channel.instagram_btn")}</span>
            <span>→</span>
          </button>
        </InteractiveCard>
      </FadeIn>

      <FadeIn delay={0.15} className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="w-full sm:w-auto text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer py-2 px-3 rounded-lg hover:bg-muted/60 transition-colors"
          >
            ← Назад к базе знаний
          </button>
        ) : <div />}
        <p className="text-[11px] text-muted-foreground text-center sm:text-right">
          {t("channel.footer_hint")}
        </p>
      </FadeIn>
    </div>
  );
}
