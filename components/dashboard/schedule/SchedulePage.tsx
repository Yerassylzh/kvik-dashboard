"use client";

import React, { useState, useEffect } from "react";
import { Clock, CalendarOff, Save } from "lucide-react";
import { useTranslations } from "next-intl";
import { DashboardPageHeader } from "@/components/dashboard/shared/DashboardPageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
        <WeeklyScheduleTab
          schedule={schedule}
          slotDuration={slotDuration}
          bufferTime={bufferTime}
          onToggleDay={toggleDay}
          onUpdateTime={updateTime}
          onUpdateSlotDuration={setSlotDuration}
          onUpdateBufferTime={setBufferTime}
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
