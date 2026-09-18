"use client";

import React, { useState, useEffect } from "react";
import { Clock, ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { SectionCard } from "@/components/dashboard/shared/SectionCard";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { AbandonmentSequenceConfig } from "@/lib/api/followUps";

interface AbandonmentStepCardProps {
  config: AbandonmentSequenceConfig;
  onSave: (config: {
    enabled?: boolean;
    steps?: Array<{ stepIndex: number; delayMinutes: number }>;
    autoDisqualifyAfterHours?: number;
  }) => Promise<void>;
  isUpdating?: boolean;
}

export function AbandonmentStepCard({
  config,
  onSave,
  isUpdating = false,
}: AbandonmentStepCardProps) {
  const t = useTranslations("dashboard");
  const [isEnabled, setIsEnabled] = useState(config?.enabled ?? true);
  const [steps, setSteps] = useState(config?.steps || []);
  const [autoDisqualifyHours, setAutoDisqualifyHours] = useState(
    config?.autoDisqualifyAfterHours ?? 72
  );
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setIsEnabled(config?.enabled ?? true);
    setSteps(config?.steps || []);
    setAutoDisqualifyHours(config?.autoDisqualifyAfterHours ?? 72);
    setHasChanges(false);
  }, [config]);

  const stepMetadata: Array<{
    stepIndex: number;
    titleKey: string;
    descKey: string;
    defaultMinutes: number;
    badgeText: string;
    badgeVariant: BadgeVariant;
    options: Array<{ label: string; minutes: number }>;
  }> = [
    {
      stepIndex: 1,
      titleKey: "automations.step_1_title",
      descKey: "automations.step_1_desc",
      defaultMinutes: 120,
      badgeText: "AI Free-form (<24h)",
      badgeVariant: "default",
      options: [
        { label: t("automations.delay_1h"), minutes: 60 },
        { label: t("automations.delay_2h_recommended"), minutes: 120 },
        { label: t("automations.delay_3h"), minutes: 180 },
        { label: t("automations.delay_4h"), minutes: 240 },
      ],
    },
    {
      stepIndex: 2,
      titleKey: "automations.step_2_title",
      descKey: "automations.step_2_desc",
      defaultMinutes: 1200,
      badgeText: "AI Free-form (<24h)",
      badgeVariant: "default",
      options: [
        { label: t("automations.delay_12h"), minutes: 720 },
        { label: t("automations.delay_16h"), minutes: 960 },
        { label: t("automations.delay_20h"), minutes: 1200 },
        { label: t("automations.delay_22h"), minutes: 1320 },
      ],
    },
    {
      stepIndex: 3,
      titleKey: "automations.step_3_title",
      descKey: "automations.step_3_desc",
      defaultMinutes: 2880,
      badgeText: "WhatsApp HSM (>24h)",
      badgeVariant: "warning",
      options: [
        { label: t("automations.delay_36h"), minutes: 2160 },
        { label: t("automations.delay_48h"), minutes: 2880 },
        { label: t("automations.delay_72h"), minutes: 4320 },
      ],
    },
  ];

  const handleStepDelayChange = (stepIndex: number, delayMinutes: number) => {
    setSteps((prev) => {
      const existing = prev.find((s) => s.stepIndex === stepIndex);
      if (existing) {
        return prev.map((s) =>
          s.stepIndex === stepIndex ? { ...s, delayMinutes } : s
        );
      }
      return [...prev, { stepIndex, delayMinutes }];
    });
    setHasChanges(true);
  };

  const getStepMinutes = (stepIndex: number, defaultMinutes: number) => {
    const found = steps.find((s) => s.stepIndex === stepIndex);
    return found ? found.delayMinutes : defaultMinutes;
  };

  const handleToggle = () => {
    setIsEnabled(!isEnabled);
    setHasChanges(true);
  };

  const handleSave = async () => {
    await onSave({
      enabled: isEnabled,
      steps: steps.map((s) => ({
        stepIndex: s.stepIndex,
        delayMinutes: s.delayMinutes,
      })),
      autoDisqualifyAfterHours: autoDisqualifyHours,
    });
    setHasChanges(false);
  };

  return (
    <SectionCard
      title={t("automations.steps_title")}
      description={t("automations.steps_desc")}
      action={
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={isEnabled}
            onChange={handleToggle}
            className="sr-only peer"
          />
          <div className="w-9 h-5 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
        </label>
      }
    >
      <div className="space-y-4">
        {/* Step Cards */}
        {stepMetadata.map((meta) => {
          const currentMinutes = getStepMinutes(meta.stepIndex, meta.defaultMinutes);

          return (
            <div
              key={meta.stepIndex}
              className="p-3.5 rounded-xl border border-border/70 bg-card hover:border-border transition-colors space-y-2.5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="h-6 w-6 rounded-md bg-primary/10 text-primary flex items-center justify-center text-xs font-bold tabular-nums">
                    {meta.stepIndex}
                  </span>
                  <span className="text-xs font-semibold text-foreground">
                    {t(meta.titleKey as any)}
                  </span>
                </div>
                <Badge variant={meta.badgeVariant} className="text-[10px]">
                  {meta.badgeText}
                </Badge>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                {t(meta.descKey as any)}
              </p>

              {/* Selector */}
              <div className="pt-1 flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <select
                  disabled={!isEnabled}
                  value={currentMinutes}
                  onChange={(e) =>
                    handleStepDelayChange(meta.stepIndex, Number(e.target.value))
                  }
                  className="w-full text-xs bg-background border border-border/80 rounded-lg px-2.5 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary disabled:opacity-50 font-medium"
                >
                  {meta.options.map((opt) => (
                    <option key={opt.minutes} value={opt.minutes}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          );
        })}

        {/* Auto Disqualification Callout */}
        <div className="p-3 rounded-xl border border-border/60 bg-muted/30 flex items-start gap-3">
          <ShieldCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-foreground">
                {t("automations.autodisqualify_title")}
              </span>
              <select
                disabled={!isEnabled}
                value={autoDisqualifyHours}
                onChange={(e) => {
                  setAutoDisqualifyHours(Number(e.target.value));
                  setHasChanges(true);
                }}
                className="text-xs bg-card border border-border/80 rounded-md px-2 py-1 text-foreground font-semibold tabular-nums"
              >
                <option value={48}>{t("automations.hours_48")}</option>
                <option value={72}>{t("automations.hours_72")}</option>
                <option value={96}>{t("automations.hours_96")}</option>
                <option value={120}>{t("automations.hours_120")}</option>
              </select>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
              {t("automations.autodisqualify_desc")}
            </p>
          </div>
        </div>

        {/* Save Button */}
        {hasChanges && (
          <div className="pt-2 flex justify-end">
            <Button
              size="sm"
              onClick={handleSave}
              loading={isUpdating}
              className="text-xs"
            >
              {t("automations.save_changes_btn")}
            </Button>
          </div>
        )}
      </div>
    </SectionCard>
  );
}
