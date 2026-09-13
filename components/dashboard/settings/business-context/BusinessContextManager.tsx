"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Save,
  Check,
  RefreshCw,
  Info,
  Building,
  DollarSign,
  ShieldAlert,
  Clock,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { SectionCard } from "@/components/dashboard/shared/SectionCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { StringListField } from "./StringListField";
import { useBusinessContext } from "@/hooks/useBusinessContext";
import type { UpdateBusinessContextDto } from "@/lib/api/businessContext";

export function BusinessContextManager() {
  const t = useTranslations("dashboard");
  const {
    context,
    isLoading,
    isSaving,
    isRegenerating,
    regenerationQueued,
    saveSuccess,
    saveContext,
    triggerRegeneration,
    clearQueueNotification,
  } = useBusinessContext();

  const [form, setForm] = useState<UpdateBusinessContextDto>({
    businessType: "",
    specialization: "",
    keyDifferentiators: [],
    servicesOffered: [],
    pricingPolicy: "",
    restrictions: [],
    teamSummary: "",
    bookingPolicy: "",
    cancellationPolicy: "",
    contactInfo: "",
    workingHours: "",
  });

  // Sync state when context is fetched
  useEffect(() => {
    if (context) {
      setForm({
        businessType: context.businessType || "",
        specialization: context.specialization || "",
        keyDifferentiators: context.keyDifferentiators || [],
        servicesOffered: context.servicesOffered || [],
        pricingPolicy: context.pricingPolicy || "",
        restrictions: context.restrictions || [],
        teamSummary: context.teamSummary || "",
        bookingPolicy: context.bookingPolicy || "",
        cancellationPolicy: context.cancellationPolicy || "",
        contactInfo: context.contactInfo || "",
        workingHours: context.workingHours || "",
      });
    }
  }, [context]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveContext(form);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Regeneration Queue Banner */}
      {regenerationQueued && (
        <div className="flex items-start justify-between gap-3 p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-700 dark:text-indigo-300">
          <div className="flex items-start gap-3 text-xs">
            <Sparkles className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
            <div>
              <p className="font-bold">{t("settings.bc_regenerating")}</p>
              <p className="text-[11px] opacity-90 mt-0.5">
                {t("settings.bc_queued_alert")}
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearQueueNotification}
            className="text-xs h-7 px-2"
          >
            ✕
          </Button>
        </div>
      )}

      {/* Hero Action Header */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-card border border-primary/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <h3 className="font-bold text-sm text-foreground">
              {t("settings.bc_title")}
            </h3>
          </div>
          <p className="text-xs text-muted-foreground max-w-xl leading-relaxed">
            {t("settings.bc_desc")}
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={triggerRegeneration}
          disabled={isRegenerating || isLoading}
          loading={isRegenerating}
          leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          className="text-xs border-primary/30 text-primary hover:bg-primary/10 shrink-0"
        >
          {isRegenerating
            ? t("settings.bc_regenerating")
            : t("settings.bc_regenerate_btn")}
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Card 1: Основные сведения */}
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
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, businessType: e.target.value }))
                }
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
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, specialization: e.target.value }))
                }
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
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, contactInfo: e.target.value }))
                }
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
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, workingHours: e.target.value }))
                }
                placeholder={t("settings.bc_working_hours_placeholder")}
                className="text-xs"
              />
            </div>
          </div>
        </SectionCard>

        {/* Card 2: Услуги, цены и преимущества */}
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
              onChange={(items) =>
                setForm((prev) => ({ ...prev, servicesOffered: items }))
              }
              badgeColor="border-primary/20 bg-primary/5 text-foreground"
            />

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                {t("settings.bc_pricing_policy")}
              </label>
              <Textarea
                rows={2}
                value={form.pricingPolicy || ""}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, pricingPolicy: e.target.value }))
                }
                placeholder={t("settings.bc_pricing_policy_placeholder")}
                className="text-xs"
              />
            </div>

            <StringListField
              label={t("settings.bc_key_differentiators")}
              description="Факторы, выгодно отличающие вас от конкурентов"
              placeholder={t("settings.bc_differentiators_add_placeholder")}
              items={form.keyDifferentiators || []}
              onChange={(items) =>
                setForm((prev) => ({ ...prev, keyDifferentiators: items }))
              }
              badgeColor="border-emerald-500/20 bg-emerald-500/5 text-foreground"
            />
          </div>
        </SectionCard>

        {/* Card 3: Правила, ограничения и команда */}
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
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, bookingPolicy: e.target.value }))
                  }
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
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      cancellationPolicy: e.target.value,
                    }))
                  }
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
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, teamSummary: e.target.value }))
                }
                placeholder={t("settings.bc_team_summary_placeholder")}
                className="text-xs"
              />
            </div>

            <StringListField
              label={t("settings.bc_restrictions")}
              description="Четкие правила того, что салон НЕ делает (услуги, возраст, форматы)"
              placeholder={t("settings.bc_restrictions_add_placeholder")}
              items={form.restrictions || []}
              onChange={(items) =>
                setForm((prev) => ({ ...prev, restrictions: items }))
              }
              badgeColor="border-amber-500/20 bg-amber-500/5 text-foreground"
            />
          </div>
        </SectionCard>

        {/* Save Bar */}
        <div className="flex items-center justify-between p-4 rounded-2xl bg-card border border-border/60 sticky bottom-4 shadow-md backdrop-blur-md">
          {saveSuccess ? (
            <span className="text-xs font-semibold text-emerald-500 flex items-center gap-1.5">
              <Check className="w-4 h-4" />
              <span>{t("settings.bc_saved_success")}</span>
            </span>
          ) : (
            <div className="text-[11px] text-muted-foreground">
              Изменения сразу применяются в системном контексте ИИ
            </div>
          )}

          <Button
            type="submit"
            disabled={isLoading}
            loading={isSaving}
            leftIcon={<Save className="w-3.5 h-3.5" />}
            className="text-xs font-semibold"
          >
            {t("settings.bc_save_btn")}
          </Button>
        </div>
      </form>
    </div>
  );
}
