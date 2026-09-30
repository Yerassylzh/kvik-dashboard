"use client";

import React from "react";
import { Sparkles } from "lucide-react";
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
    <div className="flex flex-col sm:flex-row sm:gap-2 text-xs py-1 border-b border-border/30 last:border-none">
      <span className="font-semibold text-foreground flex-shrink-0 sm:min-w-36">
        {label}:
      </span>
      <span className="text-muted-foreground leading-relaxed">{text}</span>
    </div>
  );
}

export function BusinessContextSummary({ context }: BusinessContextSummaryProps) {
  const t = useTranslations("onboarding");

  return (
    <FadeIn
      delay={0.05}
      className="p-5 rounded-2xl bg-card border border-border space-y-3 shadow-xs"
    >
      <div className="flex items-center gap-2 pb-2 border-b border-border/60">
        <Sparkles className="w-4 h-4 text-primary" />
        <h3 className="font-bold text-foreground text-sm">
          {t("knowledge.preview.ai_summary_title")}
        </h3>
      </div>
      <div className="space-y-1">
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
