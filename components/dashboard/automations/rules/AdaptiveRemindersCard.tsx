"use client";

import React, { useState, useEffect } from "react";
import { Bell, Sparkles, CheckCircle2, AlertCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { SectionCard } from "@/components/dashboard/shared/SectionCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { AppointmentRemindersConfig } from "@/lib/api/followUps";

interface AdaptiveRemindersCardProps {
  config: AppointmentRemindersConfig;
  onSave: (config: {
    enabled?: boolean;
    send24hReminder?: boolean;
    send2hReminder?: boolean;
  }) => Promise<void>;
  isUpdating?: boolean;
}

export function AdaptiveRemindersCard({
  config,
  onSave,
  isUpdating = false,
}: AdaptiveRemindersCardProps) {
  const t = useTranslations("dashboard");
  const [enabled, setEnabled] = useState(config?.enabled ?? true);
  const [send24h, setSend24h] = useState(config?.send24hReminder ?? true);
  const [send2h, setSend2h] = useState(config?.send2hReminder ?? true);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setEnabled(config?.enabled ?? true);
    setSend24h(config?.send24hReminder ?? true);
    setSend2h(config?.send2hReminder ?? true);
    setHasChanges(false);
  }, [config]);

  const handleToggle = () => {
    setEnabled(!enabled);
    setHasChanges(true);
  };

  const handleSave = async () => {
    await onSave({
      enabled,
      send24hReminder: send24h,
      send2hReminder: send2h,
    });
    setHasChanges(false);
  };

  return (
    <SectionCard
      title={t("automations.reminders_title")}
      description={t("automations.reminders_desc")}
      action={
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={enabled}
            onChange={handleToggle}
            className="sr-only peer"
          />
          <div className="w-9 h-5 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
        </label>
      }
    >
      <div className="space-y-4">
        {/* 24h Reminder Switch */}
        <div className="flex items-start justify-between gap-3 p-3 rounded-xl border border-border/70 bg-card">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-foreground">
                {t("automations.reminder_24h_label")}
              </span>
              <Badge variant="default" className="text-[10px]">
                {t("automations.reminder_rule_badge")}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t("automations.reminder_24h_desc")}
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
            <input
              type="checkbox"
              disabled={!enabled}
              checked={send24h}
              onChange={() => {
                setSend24h(!send24h);
                setHasChanges(true);
              }}
              className="sr-only peer"
            />
            <div className="w-8 h-4 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[1px] after:left-[1px] after:bg-white after:border-border after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-primary disabled:opacity-50"></div>
          </label>
        </div>

        {/* 2h Reminder Switch */}
        <div className="flex items-start justify-between gap-3 p-3 rounded-xl border border-border/70 bg-card">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-foreground">
              {t("automations.reminder_2h_label")}
            </span>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t("automations.reminder_2h_desc")}
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
            <input
              type="checkbox"
              disabled={!enabled}
              checked={send2h}
              onChange={() => {
                setSend2h(!send2h);
                setHasChanges(true);
              }}
              className="sr-only peer"
            />
            <div className="w-8 h-4 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[1px] after:left-[1px] after:bg-white after:border-border after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-primary disabled:opacity-50"></div>
          </label>
        </div>

        {/* Adaptive Rule Explanation Callout */}
        <div className="p-3 rounded-xl border border-border/60 bg-muted/30 flex items-start gap-2.5 text-[11px] text-muted-foreground leading-relaxed">
          <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-foreground block mb-0.5">
              {t("automations.anti_spam_title")}
            </span>
            {t("automations.anti_spam_desc")}
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
              {t("automations.save_reminders_btn")}
            </Button>
          </div>
        )}
      </div>
    </SectionCard>
  );
}
