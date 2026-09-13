"use client";

import React, { useState, useEffect } from "react";
import { Check, Clock, Save } from "lucide-react";
import { useTranslations } from "next-intl";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { useStaffSchedule } from "@/hooks/useStaff";
import type { StaffDto } from "@/lib/api/staff";

interface AvailabilityModalProps {
  staff: StaffDto | null;
  isOpen: boolean;
  onClose: () => void;
}

interface DayConfig {
  start: string;
  end: string;
  duration: number;
}

const DEFAULT_SCHEDULE: Record<number, DayConfig> = {
  1: { start: "09:00", end: "18:00", duration: 60 },
  2: { start: "09:00", end: "18:00", duration: 60 },
  3: { start: "09:00", end: "18:00", duration: 60 },
  4: { start: "09:00", end: "18:00", duration: 60 },
  5: { start: "09:00", end: "18:00", duration: 60 },
};

export function AvailabilityModal({ staff, isOpen, onClose }: AvailabilityModalProps) {
  const t = useTranslations("dashboard");
  const { templates, setSchedule, isLoading: isScheduleLoading } = useStaffSchedule(
    staff?.id || null
  );

  const dayNames = [
    t("staff.days.0"),
    t("staff.days.1"),
    t("staff.days.2"),
    t("staff.days.3"),
    t("staff.days.4"),
    t("staff.days.5"),
    t("staff.days.6"),
  ];

  const [activeDays, setActiveDays] = useState<Record<number, DayConfig>>(DEFAULT_SCHEDULE);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Sync with fetched templates when available
  useEffect(() => {
    if (templates && templates.length > 0) {
      const mapped: Record<number, DayConfig> = {};
      for (const item of templates) {
        mapped[item.dayOfWeek] = {
          start: item.startTime.slice(0, 5),
          end: item.endTime.slice(0, 5),
          duration: item.slotDuration || 60,
        };
      }
      setActiveDays(mapped);
    } else if (templates && templates.length === 0) {
      setActiveDays(DEFAULT_SCHEDULE);
    }
  }, [templates]);

  if (!staff) return null;

  const toggleDay = (dayIndex: number) => {
    setActiveDays((prev) => {
      const next = { ...prev };
      if (next[dayIndex]) {
        delete next[dayIndex];
      } else {
        next[dayIndex] = { start: "09:00", end: "18:00", duration: 60 };
      }
      return next;
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const list = Object.entries(activeDays).map(([dayStr, val]) => ({
        dayOfWeek: Number(dayStr),
        startTime: val.start,
        endTime: val.end,
        slotDuration: val.duration,
      }));
      await setSchedule(list);
      setIsSaved(true);
      setTimeout(() => {
        setIsSaved(false);
        onClose();
      }, 1200);
    } catch {
      // Error handled by global interceptor
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      variant="panel"
      width="lg"
      title={t("staff.schedule_title_prefix", { name: staff.name })}
      description={t("staff.schedule_desc")}
    >
      <div className="space-y-5">
        {isScheduleLoading ? (
          <div className="space-y-2.5">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div key={i} className="h-12 rounded-xl bg-muted/40 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-2.5">
            {/* Monday (1) through Saturday (6) then Sunday (0) */}
            {[1, 2, 3, 4, 5, 6, 0].map((dayIdx) => {
              const isWorking = Boolean(activeDays[dayIdx]);
              const config = activeDays[dayIdx] || {
                start: "09:00",
                end: "18:00",
                duration: 60,
              };

              return (
                <div
                  key={dayIdx}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all text-xs ${
                    isWorking
                      ? "bg-card border-border/80 shadow-2xs"
                      : "bg-muted/20 border-border/40 opacity-70"
                  }`}
                >
                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isWorking}
                      onChange={() => toggleDay(dayIdx)}
                      className="rounded border-border text-primary focus:ring-primary h-4 w-4 shrink-0"
                    />
                    <span
                      className={`font-semibold ${
                        isWorking ? "text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {dayNames[dayIdx]}
                    </span>
                  </label>

                  {isWorking ? (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 bg-muted/40 border border-border/60 rounded-lg px-2 py-1">
                        <Clock className="w-3 h-3 text-muted-foreground shrink-0" />
                        <input
                          type="time"
                          value={config.start}
                          onChange={(e) =>
                            setActiveDays((prev) => ({
                              ...prev,
                              [dayIdx]: { ...config, start: e.target.value },
                            }))
                          }
                          className="bg-transparent text-xs text-foreground font-mono focus:outline-none"
                        />
                      </div>
                      <span className="text-muted-foreground text-xs">—</span>
                      <div className="flex items-center gap-1 bg-muted/40 border border-border/60 rounded-lg px-2 py-1">
                        <Clock className="w-3 h-3 text-muted-foreground shrink-0" />
                        <input
                          type="time"
                          value={config.end}
                          onChange={(e) =>
                            setActiveDays((prev) => ({
                              ...prev,
                              [dayIdx]: { ...config, end: e.target.value },
                            }))
                          }
                          className="bg-transparent text-xs text-foreground font-mono focus:outline-none"
                        />
                      </div>
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-[11px] font-medium px-2 py-0.5 rounded-md bg-muted/50">
                      {t("staff.day_off")}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-border/40">
          {isSaved ? (
            <span className="text-xs font-semibold text-emerald-500 flex items-center gap-1.5 animate-in fade-in">
              <Check className="w-4 h-4" />
              <span>{t("staff.schedule_saved")}</span>
            </span>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSaving}
              className="text-xs"
            >
              {t("staff.cancel_btn")}
            </Button>
            <Button
              size="sm"
              loading={isSaving}
              onClick={handleSave}
              leftIcon={<Save className="w-4 h-4" />}
              className="text-xs font-bold"
            >
              {t("staff.save_schedule_btn")}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
