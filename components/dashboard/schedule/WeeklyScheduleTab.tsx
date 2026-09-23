"use client";

import React from "react";
import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import clsx from "clsx";

export interface DaySchedule {
  dayOfWeek: number;
  isOpen: boolean;
  startTime: string;
  endTime: string;
}

interface WeeklyScheduleTabProps {
  schedule: DaySchedule[];
  slotDuration: number;
  bufferTime: number;
  onToggleDay: (index: number) => void;
  onUpdateTime: (index: number, field: "startTime" | "endTime", value: string) => void;
  onUpdateSlotDuration: (val: number) => void;
  onUpdateBufferTime: (val: number) => void;
}

export function WeeklyScheduleTab({
  schedule,
  slotDuration,
  bufferTime,
  onToggleDay,
  onUpdateTime,
  onUpdateSlotDuration,
  onUpdateBufferTime,
}: WeeklyScheduleTabProps) {
  const t = useTranslations("dashboard");

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Working Hours List */}
      <div className="lg:col-span-2 space-y-3">
        <div className="p-5 rounded-2xl border border-border/80 bg-card shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-foreground">
            {t("schedule.section_weekly_hours")}
          </h3>

          <div className="space-y-2.5">
            {schedule.map((day, idx) => (
              <div
                key={day.dayOfWeek}
                className={clsx(
                  "p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3",
                  day.isOpen
                    ? "bg-card border-border/70 text-foreground"
                    : "bg-muted/10 border-border/30 opacity-60 text-muted-foreground"
                )}
              >
                <button
                  type="button"
                  role="switch"
                  aria-checked={day.isOpen}
                  onClick={() => onToggleDay(idx)}
                  className="flex items-center gap-3 min-w-47.5 text-left cursor-pointer group"
                >
                  <span
                    className={clsx(
                      "relative flex h-6 w-10 shrink-0 items-center rounded-full border transition-colors",
                      day.isOpen
                        ? "border-primary bg-primary"
                        : "border-border bg-muted"
                    )}
                  >
                    <span
                      className={clsx(
                        "flex h-4 w-4 items-center justify-center rounded-full bg-white shadow-sm transition-transform",
                        day.isOpen ? "translate-x-5" : "translate-x-1"
                      )}
                    >
                      {day.isOpen && <Check className="h-3 w-3 text-primary" />}
                    </span>
                  </span>
                  <span>
                    <span className="block font-semibold text-xs text-foreground">
                      {t(`staff.days.${day.dayOfWeek}`)}
                    </span>
                    <span className="block text-[11px] text-muted-foreground">
                      {day.isOpen ? t("schedule.day_open") : t("schedule.day_closed")}
                    </span>
                  </span>
                </button>

                {day.isOpen ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={day.startTime}
                      onChange={(e) => onUpdateTime(idx, "startTime", e.target.value)}
                      className="px-2.5 py-1.5 rounded-lg border border-border bg-muted/30 text-xs font-mono font-bold text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
                    />
                    <span className="text-xs text-muted-foreground">—</span>
                    <input
                      type="time"
                      value={day.endTime}
                      onChange={(e) => onUpdateTime(idx, "endTime", e.target.value)}
                      className="px-2.5 py-1.5 rounded-lg border border-border bg-muted/30 text-xs font-mono font-bold text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
                    />
                  </div>
                ) : (
                  <span className="text-xs font-medium text-muted-foreground italic">
                    {t("schedule.day_closed")}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Slot & Buffer Settings */}
      <div className="space-y-4">
        <div className="p-5 rounded-2xl border border-border/80 bg-card shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-foreground">
            {t("schedule.section_ai_params")}
          </h3>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1.5">
                {t("schedule.slot_duration")}
              </label>
              <select
                value={slotDuration}
                onChange={(e) => onUpdateSlotDuration(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-border bg-card text-xs font-medium text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
              >
                <option value={30}>{t("schedule.duration_30m")}</option>
                <option value={45}>{t("schedule.duration_45m")}</option>
                <option value={60}>{t("schedule.duration_60m")}</option>
                <option value={90}>{t("schedule.duration_90m")}</option>
                <option value={120}>{t("schedule.duration_120m")}</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground block mb-1.5">
                {t("schedule.buffer_time")}
              </label>
              <select
                value={bufferTime}
                onChange={(e) => onUpdateBufferTime(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-border bg-card text-xs font-medium text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
              >
                <option value={0}>{t("schedule.buffer_0m")}</option>
                <option value={5}>{t("schedule.buffer_5m")}</option>
                <option value={10}>{t("schedule.buffer_10m")}</option>
                <option value={15}>{t("schedule.buffer_15m")}</option>
              </select>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 text-[11px] text-muted-foreground leading-relaxed">
            💡 <span className="font-semibold text-foreground">{t("schedule.how_it_works_tip")}</span> {t("schedule.how_it_works_desc")}
          </div>
        </div>
      </div>
    </div>
  );
}
