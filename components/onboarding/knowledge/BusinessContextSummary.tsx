"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { BusinessContext } from "@/types/niche";
import { FadeIn } from "@/components/ui/motion/FadeIn";

interface BusinessContextSummaryProps {
  context: BusinessContext;
}

function ContextRow({
  label,
  value,
}: {
  label: string;
  value?: string | string[] | null;
}) {
  if (!value) return null;
  const text = Array.isArray(value) ? value.join("; ") : value;
  if (!text.trim()) return null;
  return (
    <div className="flex gap-2 text-xs">
      <span className="font-semibold text-foreground flex-shrink-0">
        {label}:
      </span>
      <span className="text-muted-foreground">{text}</span>
    </div>
  );
}

export function BusinessContextSummary({ context }: BusinessContextSummaryProps) {
  const t = useTranslations("onboarding");

  return (
    <FadeIn
      delay={0.05}
      className="p-4 sm:p-5 rounded-2xl bg-primary/5 border border-primary/20 space-y-2.5 shadow-xs"
    >
      <p className="font-bold text-foreground text-xs sm:text-sm flex items-center gap-2">
        <span>🤖</span>
        <span>{t("knowledge.preview.ai_summary_title")}</span>
      </p>
      <div className="space-y-1.5 pt-1">
        <ContextRow
          label={t("knowledge.preview.context_type")}
          value={context.businessType}
        />
        <ContextRow
          label={t("knowledge.preview.context_specialization")}
          value={context.specialization}
        />
        <ContextRow
          label={t("knowledge.preview.context_services")}
          value={context.servicesOffered}
        />
        <ContextRow
          label={t("knowledge.preview.context_pricing")}
          value={context.pricingPolicy}
        />
        <ContextRow
          label={t("knowledge.preview.context_booking")}
          value={context.bookingPolicy}
        />
        <ContextRow
          label={t("knowledge.preview.context_team")}
          value={context.teamSummary}
        />
        <ContextRow
          label={t("knowledge.preview.context_schedule")}
          value={context.workingHours}
        />
      </div>
    </FadeIn>
  );
}
