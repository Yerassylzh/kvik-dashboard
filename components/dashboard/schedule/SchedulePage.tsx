"use client";

import React, { useState, useEffect } from "react";
import { Clock, CalendarOff, Save, Plus, Trash2, CheckCircle2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { DashboardPageHeader } from "@/components/dashboard/shared/DashboardPageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useWorkspaceSchedule } from "@/hooks/useWorkspaceSchedule";
import { toast } from "sonner";
import clsx from "clsx";

interface DaySchedule {
  dayOfWeek: number;
  isOpen: boolean;
  startTime: string;
  endTime: string;
}

const DEFAULT_DAYS: DaySchedule[] = [
  { dayOfWeek: 1, isOpen: true, startTime: "09:00", endTime: "19:00" },
  { dayOfWeek: 2, isOpen: true, startTime: "09:00", endTime: "19:00" },
  { dayOfWeek: 3, isOpen: true, startTime: "09:00", endTime: "19:00" },
  { dayOfWeek: 4, isOpen: true, startTime: "09:00", endTime: "19:00" },
  { dayOfWeek: 5, isOpen: true, startTime: "09:00", endTime: "19:00" },
  { dayOfWeek: 6, isOpen: true, startTime: "10:00", endTime: "18:00" },
  { dayOfWeek: 0, isOpen: false, startTime: "10:00", endTime: "18:00" },
];

export function SchedulePage() {
  const t = useTranslations("dashboard");
  const [activeTab, setActiveTab] = useState<"weekly" | "holidays">("weekly");
  const { templates, overrides, isLoading, setSchedule, addOverride, removeOverride } =
    useWorkspaceSchedule();

  const [schedule, setScheduleState] = useState<DaySchedule[]>(DEFAULT_DAYS);
  const [slotDuration, setSlotDuration] = useState<number>(60);
  const [bufferTime, setBufferTime] = useState<number>(10);
  const [newHolidayDate, setNewHolidayDate] = useState("");
  const [newHolidayReason, setNewHolidayReason] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isAddingHoliday, setIsAddingHoliday] = useState(false);

  // Sync with fetched templates
  useEffect(() => {
    if (templates && templates.length > 0) {
      setScheduleState((prev) =>
        prev.map((d) => {
          const match = templates.find((t) => t.dayOfWeek === d.dayOfWeek);
          if (match) {
            return {
              ...d,
              isOpen: match.isOpen,
              startTime: match.startTime?.slice(0, 5) || "09:00",
              endTime: match.endTime?.slice(0, 5) || "19:00",
            };
          }
          return d;
        })
      );
      if (templates[0]?.slotDuration) {
        setSlotDuration(templates[0].slotDuration);
      }
    }
  }, [templates]);

  const toggleDay = (index: number) => {
    setScheduleState((prev) =>
      prev.map((d, i) => (i === index ? { ...d, isOpen: !d.isOpen } : d))
    );
  };

  const updateTime = (index: number, field: "startTime" | "endTime", value: string) => {
    setScheduleState((prev) =>
      prev.map((d, i) => (i === index ? { ...d, [field]: value } : d))
    );
  };

  const handleAddHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHolidayDate) return;

    setIsAddingHoliday(true);
    try {
      await addOverride({
        date: newHolidayDate,
        isClosed: true,
        reason: newHolidayReason.trim() || t("schedule.default_holiday_reason"),
      });
      setNewHolidayDate("");
      setNewHolidayReason("");
      toast.success(t("schedule.holiday_added_toast"));
    } catch {
      // Handled by API error interceptor
    } finally {
      setIsAddingHoliday(false);
    }
  };

  const handleRemoveHoliday = async (id: string) => {
    try {
      await removeOverride(id);
      toast.info(t("schedule.holiday_removed_toast"));
    } catch {
      // Handled by API error interceptor
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload = schedule.map((d) => ({
        dayOfWeek: d.dayOfWeek,
        startTime: d.startTime,
        endTime: d.endTime,
        isOpen: d.isOpen,
        slotDuration,
      }));
      await setSchedule(payload);
      toast.success(t("schedule.saved_success"));
    } catch {
      // Handled by API error interceptor
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title={t("schedule.title")}
        description={t("schedule.desc")}
        badge={<Badge variant="success">{t("schedule.badge_synced")}</Badge>}
        actions={
          <Button
            size="sm"
            onClick={handleSave}
            loading={isSaving}
            disabled={isLoading}
            leftIcon={<Save className="w-4 h-4" />}
            className="text-xs rounded-xl"
          >
            {t("schedule.save_btn")}
          </Button>
        }
        tabs={[
          {
            id: "weekly",
            label: t("schedule.tab_weekly"),
            icon: Clock,
            active: activeTab === "weekly",
            onClick: () => setActiveTab("weekly"),
          },
          {
            id: "holidays",
            label: t("schedule.tab_holidays"),
            icon: CalendarOff,
            count: overrides.length,
            active: activeTab === "holidays",
            onClick: () => setActiveTab("holidays"),
          },
        ]}
      />

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-3">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div key={i} className="h-14 rounded-xl bg-muted/40 animate-pulse" />
            ))}
          </div>
          <div className="h-48 rounded-2xl bg-muted/40 animate-pulse" />
        </div>
      ) : activeTab === "weekly" ? (
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
                    <div className="flex items-center gap-3 min-w-[140px]">
                      <button
                        type="button"
                        onClick={() => toggleDay(idx)}
                        className={clsx(
                          "w-5 h-5 rounded-md border flex items-center justify-center transition-colors cursor-pointer",
                          day.isOpen
                            ? "bg-primary border-primary text-primary-foreground"
                            : "border-border bg-card"
                        )}
                      >
                        {day.isOpen && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </button>
                      <span className="font-semibold text-xs">
                        {t(`staff.days.${day.dayOfWeek}`)}
                      </span>
                    </div>

                    {day.isOpen ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="time"
                          value={day.startTime}
                          onChange={(e) => updateTime(idx, "startTime", e.target.value)}
                          className="px-2.5 py-1.5 rounded-lg border border-border bg-muted/30 text-xs font-mono font-bold text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
                        />
                        <span className="text-xs text-muted-foreground">—</span>
                        <input
                          type="time"
                          value={day.endTime}
                          onChange={(e) => updateTime(idx, "endTime", e.target.value)}
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
                    onChange={(e) => setSlotDuration(Number(e.target.value))}
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
                    onChange={(e) => setBufferTime(Number(e.target.value))}
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
      ) : (
        /* Holiday & Emergency Overrides */
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
                        onClick={() => handleRemoveHoliday(h.id)}
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
              onSubmit={handleAddHoliday}
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
                    onChange={(e) => setNewHolidayDate(e.target.value)}
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
                    onChange={(e) => setNewHolidayReason(e.target.value)}
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
      )}
    </div>
  );
}
