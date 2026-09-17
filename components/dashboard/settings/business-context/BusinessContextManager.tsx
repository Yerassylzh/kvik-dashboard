"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, Save, Check, RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { useBusinessContext } from "@/hooks/useBusinessContext";
import { BusinessGeneralSection } from "./BusinessGeneralSection";
import { BusinessServicesSection } from "./BusinessServicesSection";
import { BusinessRulesSection } from "./BusinessRulesSection";
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

  const handlePatchForm = (patch: Partial<UpdateBusinessContextDto>) => {
    setForm((prev) => ({ ...prev, ...patch }));
  };

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
        <BusinessGeneralSection form={form} onChange={handlePatchForm} />
        <BusinessServicesSection form={form} onChange={handlePatchForm} />
        <BusinessRulesSection form={form} onChange={handlePatchForm} />

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
