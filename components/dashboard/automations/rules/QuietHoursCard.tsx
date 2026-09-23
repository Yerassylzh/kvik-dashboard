"use client";

import React, { useState, useEffect } from "react";
import { Moon, Sun, Clock } from "lucide-react";
import { useTranslations } from "next-intl";
import { SectionCard } from "@/components/dashboard/shared/SectionCard";
import { Button } from "@/components/ui/button";
import type { QuietHoursConfig } from "@/lib/api/followUps";

interface QuietHoursCardProps {
  config: QuietHoursConfig;
  onSave: (config: Partial<QuietHoursConfig>) => Promise<void>;
  isUpdating?: boolean;
}

export function QuietHoursCard({
  config,
  onSave,
  isUpdating = false,
}: QuietHoursCardProps) {
  const t = useTranslations("dashboard");
  const [enabled, setEnabled] = useState(config?.enabled ?? true);
  const [start, setStart] = useState(config?.start || "21:30");
  const [end, setEnd] = useState(config?.end || "09:00");
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setEnabled(config?.enabled ?? true);
    setStart(config?.start || "21:30");
    setEnd(config?.end || "09:00");
    setHasChanges(false);
  }, [config]);

  const handleToggle = () => {
    setEnabled(!enabled);
    setHasChanges(true);
  };

  const handleSave = async () => {
    await onSave({
      enabled,
      start,
      end,
    });
    setHasChanges(false);
  };

  return (
    <SectionCard
      title={t("automations.quiet_hours_title")}
      description={t("automations.quiet_hours_desc")}
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
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{t("automations.quiet_hours_timezone")}</span>
          <span className="font-mono text-[11px] font-medium text-foreground bg-muted/50 px-2 py-0.5 rounded">
            {config?.timezone || "Asia/Almaty"}
          </span>
        </div>

        {/* Time Inputs */}
        <div className="grid grid-cols-2 gap-3 pt-0.5">
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
              <Moon className="w-3 h-3 text-indigo-500" />
              {t("automations.quiet_hours_start")}
            </label>
            <input
              type="time"
              disabled={!enabled}
              value={start}
              onChange={(e) => {
                setStart(e.target.value);
                setHasChanges(true);
              }}
              className="w-full text-xs bg-background border border-border/80 rounded-lg px-2.5 py-1.5 text-foreground font-mono tabular-nums focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary disabled:opacity-50"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
              <Sun className="w-3 h-3 text-amber-500" />
              {t("automations.quiet_hours_end")}
            </label>
            <input
              type="time"
              disabled={!enabled}
              value={end}
              onChange={(e) => {
                setEnd(e.target.value);
                setHasChanges(true);
              }}
              className="w-full text-xs bg-background border border-border/80 rounded-lg px-2.5 py-1.5 text-foreground font-mono tabular-nums focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary disabled:opacity-50"
            />
          </div>
        </div>

        {/* Note */}
        <p className="text-[11px] text-muted-foreground leading-relaxed pt-1 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-muted-foreground/70 shrink-0" />
          <span>{t("automations.quiet_hours_note")}</span>
        </p>

        {/* Save Button */}
        {hasChanges && (
          <div className="pt-2 border-t border-border/60 flex justify-end">
            <Button
              size="sm"
              onClick={handleSave}
              loading={isUpdating}
              className="text-xs"
            >
              {t("automations.save_hours_btn")}
            </Button>
          </div>
        )}
      </div>
    </SectionCard>
  );
}
