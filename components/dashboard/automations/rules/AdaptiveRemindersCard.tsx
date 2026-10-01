"use client";

import React, { useState, useEffect } from "react";
import { Info } from "lucide-react";
import { useTranslations } from "next-intl";
import { SectionCard } from "@/components/dashboard/shared/SectionCard";
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
    if (!config) return;
    const enabledVal = config.enabled ?? true;
    const send24hVal = config.send24hReminder ?? true;
    const send2hVal = config.send2hReminder ?? true;
    queueMicrotask(() => {
      setEnabled(enabledVal);
      setSend24h(send24hVal);
      setSend2h(send2hVal);
      setHasChanges(false);
    });
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
          <div className="w-9 h-5 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary" />
        </label>
      }
    >
      <div className="divide-y divide-border/50">
        {/* 24h Reminder Row */}
        <div className="flex items-center justify-between py-3 gap-3">
          <div className="min-w-0">
            <span className="text-xs font-semibold text-foreground">
              {t("automations.reminder_24h_label")}
            </span>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              {t("automations.reminder_24h_desc")}
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer shrink-0">
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
            <div className="w-8 h-4 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[1px] after:left-[1px] after:bg-white after:border-border after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-primary disabled:opacity-50" />
          </label>
        </div>

        {/* 2h Reminder Row */}
        <div className="flex items-center justify-between py-3 gap-3">
          <div className="min-w-0">
            <span className="text-xs font-semibold text-foreground">
              {t("automations.reminder_2h_label")}
            </span>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              {t("automations.reminder_2h_desc")}
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer shrink-0">
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
            <div className="w-8 h-4 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[1px] after:left-[1px] after:bg-white after:border-border after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-primary disabled:opacity-50" />
          </label>
        </div>
      </div>

      {/* Subtle Micro-Note instead of giant banner */}
      <div className="mt-2 pt-2 border-t border-border/40 flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <Info className="w-3.5 h-3.5 text-muted-foreground/80 shrink-0" />
        <span>{t("automations.anti_spam_inline")}</span>
      </div>

      {hasChanges && (
        <div className="pt-3 border-t border-border/60 mt-3 flex justify-end">
          <Button size="sm" onClick={handleSave} loading={isUpdating} className="text-xs">
            {t("automations.save_reminders_btn")}
          </Button>
        </div>
      )}
    </SectionCard>
  );
}
