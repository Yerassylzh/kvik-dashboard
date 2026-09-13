"use client";

import React, { useState } from "react";
import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { SectionCard } from "@/components/dashboard/shared/SectionCard";
import { Button } from "@/components/ui/button";
import { useStaffSchedule } from "@/hooks/useStaff";
import type { StaffDto } from "@/lib/api/staff";

interface AvailabilityEditorProps {
  staff: StaffDto;
}

export function AvailabilityEditor({ staff }: AvailabilityEditorProps) {
  const t = useTranslations("dashboard");
  const { setSchedule, isLoading } = useStaffSchedule(staff.id);

  const dayNames = [
    t("staff.days.0"),
    t("staff.days.1"),
    t("staff.days.2"),
    t("staff.days.3"),
    t("staff.days.4"),
    t("staff.days.5"),
    t("staff.days.6"),
  ];

  const [activeDays, setActiveDays] = useState<Record<number, { start: string; end: string; duration: number }>>({
    1: { start: "09:00", end: "18:00", duration: 60 },
    2: { start: "09:00", end: "18:00", duration: 60 },
    3: { start: "09:00", end: "18:00", duration: 60 },
    4: { start: "09:00", end: "18:00", duration: 60 },
    5: { start: "09:00", end: "18:00", duration: 60 },
  });

  const [isSaved, setIsSaved] = useState(false);

  const handleSaveWeekly = async () => {
    const list = Object.entries(activeDays).map(([dayStr, val]) => ({
      dayOfWeek: Number(dayStr),
      startTime: val.start,
      endTime: val.end,
      slotDuration: val.duration,
    }));
    await setSchedule(list);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

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

  return (
    <SectionCard
      title={t("staff.schedule_title_prefix", { name: staff.name })}
      description={t("staff.schedule_desc")}
      className="max-w-2xl"
    >
      <div className="space-y-4 pt-2">
        <div className="space-y-2.5">
          {[1, 2, 3, 4, 5, 6, 0].map((dayIdx) => {
            const isWorking = Boolean(activeDays[dayIdx]);
            const config = activeDays[dayIdx] || { start: "09:00", end: "18:00", duration: 60 };

            return (
              <div
                key={dayIdx}
                className="flex items-center justify-between p-3 rounded-xl bg-card border border-border/50 text-xs"
              >
                <div className="flex items-center gap-3 w-36">
                  <input
                    type="checkbox"
                    checked={isWorking}
                    onChange={() => toggleDay(dayIdx)}
                    className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                  />
                  <span className={`font-semibold ${isWorking ? "text-foreground" : "text-muted-foreground"}`}>
                    {dayNames[dayIdx]}
                  </span>
                </div>

                {isWorking ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={config.start}
                      onChange={(e) =>
                        setActiveDays((prev) => ({
                          ...prev,
                          [dayIdx]: { ...config, start: e.target.value },
                        }))
                      }
                      className="bg-muted/40 border border-border/60 rounded-lg px-2 py-1 text-xs text-foreground font-mono"
                    />
                    <span className="text-muted-foreground">—</span>
                    <input
                      type="time"
                      value={config.end}
                      onChange={(e) =>
                        setActiveDays((prev) => ({
                          ...prev,
                          [dayIdx]: { ...config, end: e.target.value },
                        }))
                      }
                      className="bg-muted/40 border border-border/60 rounded-lg px-2 py-1 text-xs text-foreground font-mono"
                    />
                  </div>
                ) : (
                  <span className="text-muted-foreground italic">{t("staff.day_off")}</span>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-border/40">
          {isSaved ? (
            <span className="text-xs font-semibold text-emerald-500 flex items-center gap-1">
              <Check className="w-4 h-4" />
              <span>{t("staff.schedule_saved")}</span>
            </span>
          ) : (
            <div />
          )}

          <Button size="sm" onClick={handleSaveWeekly}>
            {t("staff.save_schedule_btn")}
          </Button>
        </div>
      </div>
    </SectionCard>
  );
}
