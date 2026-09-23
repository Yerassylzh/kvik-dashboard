"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Clock, CalendarOff } from "lucide-react";
import { useTranslations } from "next-intl";
import { DashboardPageHeader } from "@/components/dashboard/shared/DashboardPageHeader";
import { useWorkspaceSchedule } from "@/hooks/useWorkspaceSchedule";
import { toast } from "sonner";
import { WeeklyScheduleTab, type DaySchedule } from "./WeeklyScheduleTab";
import { HolidaysScheduleTab } from "./HolidaysScheduleTab";

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
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "error">("saved");
  const [isAddingHoliday, setIsAddingHoliday] = useState(false);
  const [hasUserChanges, setHasUserChanges] = useState(false);

  const displayedSchedule = useMemo(() => {
    if (hasUserChanges || templates.length === 0) return schedule;

    return schedule.map((day) => {
      const template = templates.find((item) => item.dayOfWeek === day.dayOfWeek);
      return template
        ? {
            ...day,
            isOpen: template.isOpen,
            startTime: template.startTime?.slice(0, 5) || day.startTime,
            endTime: template.endTime?.slice(0, 5) || day.endTime,
          }
        : day;
    });
  }, [hasUserChanges, schedule, templates]);

  const displayedSlotDuration =
    hasUserChanges || !templates[0]?.slotDuration
      ? slotDuration
      : templates[0].slotDuration;

  const toggleDay = (index: number) => {
    setHasUserChanges(true);
    setScheduleState((prev) =>
      prev.map((d, i) => (i === index ? { ...d, isOpen: !d.isOpen } : d))
    );
  };

  const updateTime = (index: number, field: "startTime" | "endTime", value: string) => {
    setHasUserChanges(true);
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

  const saveChanges = useCallback(async () => {
    setIsSaving(true);
    setSaveStatus("saving");
    try {
      const payload = displayedSchedule.map((d) => ({
        dayOfWeek: d.dayOfWeek,
        startTime: d.startTime,
        endTime: d.endTime,
        isOpen: d.isOpen,
        slotDuration: displayedSlotDuration,
      }));
      await setSchedule(payload);
      setHasUserChanges(false);
      setSaveStatus("saved");
    } catch {
      setSaveStatus("error");
    } finally {
      setIsSaving(false);
    }
  }, [displayedSchedule, displayedSlotDuration, setSchedule]);

  useEffect(() => {
    if (!hasUserChanges || isLoading) return;

    const timeoutId = window.setTimeout(() => {
      void saveChanges();
    }, 500);

    return () => window.clearTimeout(timeoutId);
  }, [hasUserChanges, isLoading, saveChanges]);

  const handleScheduleChange = (update: () => void) => {
    setHasUserChanges(true);
    update();
  };

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title={t("schedule.title")}
        description={t("schedule.desc")}
        badge={
          <span
            className={
              saveStatus === "error"
                ? "text-xs font-medium text-destructive"
                : "text-xs font-medium text-muted-foreground"
            }
          >
            {isSaving
              ? t("schedule.status_saving")
              : saveStatus === "error"
              ? t("schedule.status_error")
              : t("schedule.status_saved")}
          </span>
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
        <WeeklyScheduleTab
          schedule={displayedSchedule}
          slotDuration={displayedSlotDuration}
          bufferTime={bufferTime}
          onToggleDay={toggleDay}
          onUpdateTime={updateTime}
          onUpdateSlotDuration={(value) =>
            handleScheduleChange(() => setSlotDuration(value))
          }
          onUpdateBufferTime={(value) =>
            handleScheduleChange(() => setBufferTime(value))
          }
        />
      ) : (
        <HolidaysScheduleTab
          overrides={overrides}
          newHolidayDate={newHolidayDate}
          newHolidayReason={newHolidayReason}
          isAddingHoliday={isAddingHoliday}
          onDateChange={setNewHolidayDate}
          onReasonChange={setNewHolidayReason}
          onAddHoliday={handleAddHoliday}
          onRemoveHoliday={handleRemoveHoliday}
        />
      )}
    </div>
  );
}
