"use client";

import React, { useState, useEffect } from "react";
import { Moon, Sun, Info } from "lucide-react";
import { useTranslations } from "next-intl";
import { SectionCard } from "@/components/dashboard/shared/SectionCard";
import { Badge } from "@/components/ui/badge";
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
          <div className="w-9 h-5 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
        </label>
      }
    >
      <div className="space-y-3.5">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground font-medium">
            {t("automations.quiet_hours_timezone")}
          </span>
          <Badge variant="default" className="text-[11px] font-mono">
            {config?.timezone || "Asia/Almaty (UTC+5)"}
          </Badge>
        </div>

        {/* Time Inputs */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="space-y-1.5">
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

          <div className="space-y-1.5">
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

        {/* Reschedule Note */}
        <div className="p-2.5 rounded-lg border border-border/60 bg-muted/20 flex items-start gap-2 text-[11px] text-muted-foreground leading-relaxed">
          <Info className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
          <span>{t("automations.quiet_hours_note")}</span>
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
              {t("automations.save_hours_btn")}
            </Button>
          </div>
        )}
      </div>
    </SectionCard>
  );
}
