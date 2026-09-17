"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { SectionCard } from "@/components/dashboard/shared/SectionCard";
import { Textarea } from "@/components/ui/textarea";
import { StringListField } from "./StringListField";
import type { UpdateBusinessContextDto } from "@/lib/api/businessContext";

interface BusinessServicesSectionProps {
  form: UpdateBusinessContextDto;
  onChange: (patch: Partial<UpdateBusinessContextDto>) => void;
}

export function BusinessServicesSection({ form, onChange }: BusinessServicesSectionProps) {
  const t = useTranslations("dashboard");

  return (
    <SectionCard
      title={t("settings.bc_section_services")}
      description="Каталог услуг с диапазоном цен и ключевые преимущества"
    >
      <div className="space-y-5 pt-2">
        <StringListField
          label={t("settings.bc_services_offered")}
          description="ИИ использует эти формулировки и цены при консультации клиентов"
          placeholder={t("settings.bc_services_add_placeholder")}
          items={form.servicesOffered || []}
          onChange={(items) => onChange({ servicesOffered: items })}
          badgeColor="border-primary/20 bg-primary/5 text-foreground"
        />

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">
            {t("settings.bc_pricing_policy")}
          </label>
          <Textarea
            rows={2}
            value={form.pricingPolicy || ""}
            onChange={(e) => onChange({ pricingPolicy: e.target.value })}
            placeholder={t("settings.bc_pricing_policy_placeholder")}
            className="text-xs"
          />
        </div>

        <StringListField
          label={t("settings.bc_key_differentiators")}
          description="Факторы, выгодно отличающие вас от конкурентов"
          placeholder={t("settings.bc_differentiators_add_placeholder")}
          items={form.keyDifferentiators || []}
          onChange={(items) => onChange({ keyDifferentiators: items })}
          badgeColor="border-emerald-500/20 bg-emerald-500/5 text-foreground"
        />
      </div>
    </SectionCard>
  );
}
