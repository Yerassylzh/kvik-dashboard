"use client";

import React, { useState, useEffect } from "react";
import { Check, Clock, Save, RotateCcw, Building2, User } from "lucide-react";
import { useTranslations } from "next-intl";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { useStaffSchedule } from "@/hooks/useStaff";
import type { StaffDto } from "@/lib/api/staff";
import { toast } from "sonner";

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
  const { templates, setSchedule, resetSchedule, isLoading: isScheduleLoading } = useStaffSchedule(
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
  const [isResetting, setIsResetting] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const hasCustomSchedule = Boolean(templates && templates.length > 0);

  // Sync with fetched templates when available
  useEffect(() => {
    if (templates && templates.length > 0) {
      const mapped: Record<number, DayConfig> = {};
      for (const item of templates) {
        mapped[item.dayOfWeek] = {
          start: item.startTime?.slice(0, 5) || "09:00",
          end: item.endTime?.slice(0, 5) || "18:00",
          duration: item.slotDuration || 60,
        };
      }
      queueMicrotask(() => {
        setActiveDays(mapped);
      });
    } else if (templates && templates.length === 0) {
      queueMicrotask(() => {
        setActiveDays(DEFAULT_SCHEDULE);
      });
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
      toast.success(t("staff.schedule_saved"));
      setTimeout(() => {
        setIsSaved(false);
        onClose();
      }, 1000);
    } catch {
      // Error handled by global interceptor
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetToClinic = async () => {
    setIsResetting(true);
    try {
      await resetSchedule();
      toast.success(t("staff.reset_success"));
      setActiveDays(DEFAULT_SCHEDULE);
    } catch {
      // Error handled by global interceptor
    } finally {
      setIsResetting(false);
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
        {/* Inheritance Status Banner */}
        <div className="flex items-center justify-between p-3 rounded-xl border border-border/70 bg-muted/20 text-xs">
          <div className="flex items-center gap-2">
            {hasCustomSchedule ? (
              <>
                <User className="w-4 h-4 text-primary" />
                <div>
                  <span className="font-semibold text-foreground">
                    {t("staff.schedule_custom_label")}
                  </span>
                  <p className="text-[11px] text-muted-foreground">
                    {t("staff.schedule_custom_desc")}
                  </p>
                </div>
              </>
            ) : (
              <>
                <Building2 className="w-4 h-4 text-emerald-500" />
                <div>
                  <span className="font-semibold text-foreground">
                    {t("staff.schedule_inherited_label")}
                  </span>
                  <p className="text-[11px] text-muted-foreground">
                    {t("staff.schedule_inherited_desc")}
                  </p>
                </div>
              </>
            )}
          </div>

          {hasCustomSchedule && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              loading={isResetting}
              onClick={handleResetToClinic}
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
              className="text-[11px] h-7 px-2.5"
            >
              {t("staff.reset_to_clinic_btn")}
            </Button>
          )}
        </div>

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
                      : "bg-muted/10 border-border/30 opacity-60"
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
                      <div className="flex items-center gap-1 bg-muted/30 border border-border/60 rounded-lg px-2 py-1">
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
                      <div className="flex items-center gap-1 bg-muted/30 border border-border/60 rounded-lg px-2 py-1">
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
                    <span className="text-muted-foreground text-[11px] font-medium px-2 py-0.5 rounded-md bg-muted/40">
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
