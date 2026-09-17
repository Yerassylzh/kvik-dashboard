"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { SectionCard } from "@/components/dashboard/shared/SectionCard";
import { Input } from "@/components/ui/input";
import { StringListField } from "./StringListField";
import type { UpdateBusinessContextDto } from "@/lib/api/businessContext";

interface BusinessRulesSectionProps {
  form: UpdateBusinessContextDto;
  onChange: (patch: Partial<UpdateBusinessContextDto>) => void;
}

export function BusinessRulesSection({ form, onChange }: BusinessRulesSectionProps) {
  const t = useTranslations("dashboard");

  return (
    <SectionCard
      title={t("settings.bc_section_rules")}
      description="Политики бронирования, отмены, штат и строгие ограничения"
    >
      <div className="space-y-5 pt-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              {t("settings.bc_booking_policy")}
            </label>
            <Input
              type="text"
              value={form.bookingPolicy || ""}
              onChange={(e) => onChange({ bookingPolicy: e.target.value })}
              placeholder={t("settings.bc_booking_policy_placeholder")}
              className="text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              {t("settings.bc_cancellation_policy")}
            </label>
            <Input
              type="text"
              value={form.cancellationPolicy || ""}
              onChange={(e) => onChange({ cancellationPolicy: e.target.value })}
              placeholder={t("settings.bc_cancellation_policy_placeholder")}
              className="text-xs"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">
            {t("settings.bc_team_summary")}
          </label>
          <Input
            type="text"
            value={form.teamSummary || ""}
            onChange={(e) => onChange({ teamSummary: e.target.value })}
            placeholder={t("settings.bc_team_summary_placeholder")}
            className="text-xs"
          />
        </div>

        <StringListField
          label={t("settings.bc_restrictions")}
          description="Четкие правила того, что салон НЕ делает (услуги, возраст, форматы)"
          placeholder={t("settings.bc_restrictions_add_placeholder")}
          items={form.restrictions || []}
          onChange={(items) => onChange({ restrictions: items })}
          badgeColor="border-amber-500/20 bg-amber-500/5 text-foreground"
        />
      </div>
    </SectionCard>
  );
}
