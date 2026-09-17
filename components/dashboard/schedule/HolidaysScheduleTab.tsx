"use client";

import React from "react";
import { Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import type { WorkspaceScheduleOverrideDto } from "@/lib/api/workspacesSchedule";

interface HolidaysScheduleTabProps {
  overrides: WorkspaceScheduleOverrideDto[];
  newHolidayDate: string;
  newHolidayReason: string;
  isAddingHoliday: boolean;
  onDateChange: (date: string) => void;
  onReasonChange: (reason: string) => void;
  onAddHoliday: (e: React.FormEvent) => void;
  onRemoveHoliday: (id: string) => void;
}

export function HolidaysScheduleTab({
  overrides,
  newHolidayDate,
  newHolidayReason,
  isAddingHoliday,
  onDateChange,
  onReasonChange,
  onAddHoliday,
  onRemoveHoliday,
}: HolidaysScheduleTabProps) {
  const t = useTranslations("dashboard");

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-3">
        <div className="p-5 rounded-2xl border border-border/80 bg-card shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-foreground">
            {t("schedule.section_holidays")}
          </h3>

          {overrides.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-border rounded-xl text-xs text-muted-foreground">
              {t("schedule.no_holidays")}
            </div>
          ) : (
            <div className="space-y-2">
              {overrides.map((h) => (
                <div
                  key={h.id}
                  className="p-3 rounded-xl border border-border/70 bg-muted/20 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-foreground">
                      {h.date ? new Date(h.date).toISOString().split("T")[0] : ""}
                    </span>
                    <span className="text-muted-foreground font-medium">
                      {h.reason || t("schedule.default_holiday_reason")}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemoveHoliday(h.id)}
                    className="p-1 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Holiday Form */}
      <div>
        <form
          onSubmit={onAddHoliday}
          className="p-5 rounded-2xl border border-border/80 bg-card shadow-xs space-y-4"
        >
          <h3 className="text-sm font-bold text-foreground">
            {t("schedule.add_override")}
          </h3>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">
                {t("schedule.holiday_date_label")}
              </label>
              <input
                type="date"
                required
                value={newHolidayDate}
                onChange={(e) => onDateChange(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-border bg-card text-xs font-mono text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">
                {t("schedule.override_reason")}
              </label>
              <input
                type="text"
                placeholder={t("schedule.holiday_reason_placeholder")}
                value={newHolidayReason}
                onChange={(e) => onReasonChange(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-border bg-card text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
              />
            </div>

            <Button
              type="submit"
              size="sm"
              loading={isAddingHoliday}
              leftIcon={<Plus className="w-4 h-4" />}
              className="w-full text-xs rounded-xl"
            >
              {t("schedule.add_holiday_btn")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
