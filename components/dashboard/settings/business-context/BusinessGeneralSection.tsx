"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { SectionCard } from "@/components/dashboard/shared/SectionCard";
import { Input } from "@/components/ui/input";
import type { UpdateBusinessContextDto } from "@/lib/api/businessContext";

interface BusinessGeneralSectionProps {
  form: UpdateBusinessContextDto;
  onChange: (patch: Partial<UpdateBusinessContextDto>) => void;
}

export function BusinessGeneralSection({ form, onChange }: BusinessGeneralSectionProps) {
  const t = useTranslations("dashboard");

  return (
    <SectionCard
      title={t("settings.bc_section_general")}
      description="Базовые характеристики бизнеса, профиль и график"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">
            {t("settings.bc_business_type")}
          </label>
          <Input
            type="text"
            value={form.businessType || ""}
            onChange={(e) => onChange({ businessType: e.target.value })}
            placeholder={t("settings.bc_business_type_placeholder")}
            className="text-xs"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">
            {t("settings.bc_specialization")}
          </label>
          <Input
            type="text"
            value={form.specialization || ""}
            onChange={(e) => onChange({ specialization: e.target.value })}
            placeholder={t("settings.bc_specialization_placeholder")}
            className="text-xs"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">
            {t("settings.bc_contact_info")}
          </label>
          <Input
            type="text"
            value={form.contactInfo || ""}
            onChange={(e) => onChange({ contactInfo: e.target.value })}
            placeholder={t("settings.bc_contact_info_placeholder")}
            className="text-xs"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">
            {t("settings.bc_working_hours")}
          </label>
          <Input
            type="text"
            value={form.workingHours || ""}
            onChange={(e) => onChange({ workingHours: e.target.value })}
            placeholder={t("settings.bc_working_hours_placeholder")}
            className="text-xs"
          />
        </div>
      </div>
    </SectionCard>
  );
}
