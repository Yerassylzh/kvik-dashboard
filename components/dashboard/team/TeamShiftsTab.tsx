"use client";

import React, { useState } from "react";
import { Building2, User, Clock } from "lucide-react";
import { useTranslations } from "next-intl";
import { EmptyState } from "@/components/dashboard/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { EntityAvatar } from "@/components/dashboard/shared/EntityAvatar";
import { AvailabilityModal } from "@/components/dashboard/settings/staff/AvailabilityModal";
import { useStaff, useStaffSchedule } from "@/hooks/useStaff";
import type { StaffDto } from "@/lib/api/staff";

/**
 * Builds a compact working-days label for a set of working day indexes,
 * e.g. [1,2,3,4,5] -> "Пн–Пт", [1,2,3,5] -> "Пн–Ср, Пт".
 */
function compactDayRanges(days: number[], dayShort: string[]): string {
  if (days.length === 0) return "";
  const sorted = [...new Set(days)].sort((a, b) => a - b);
  const groups: number[][] = [];
  for (const day of sorted) {
    const last = groups[groups.length - 1];
    if (last && day === last[last.length - 1] + 1) {
      last.push(day);
    } else {
      groups.push([day]);
    }
  }
  return groups
    .map((g) =>
      g.length === 1
        ? dayShort[g[0]]
        : `${dayShort[g[0]]}–${dayShort[g[g.length - 1]]}`
    )
    .join(", ");
}

function ShiftsShiftRow({
  staff,
  onSchedule,
  isScheduling,
}: {
  staff: StaffDto;
  onSchedule: () => void;
  isScheduling: boolean;
}) {
  const t = useTranslations("dashboard");
  const { templates, overrides, isLoading } = useStaffSchedule(staff.id);
  const dayShort = [
    t("team.day_short.0"),
    t("team.day_short.1"),
    t("team.day_short.2"),
    t("team.day_short.3"),
    t("team.day_short.4"),
    t("team.day_short.5"),
    t("team.day_short.6"),
  ];

  const hasCustomSchedule = templates.length > 0;
  const workingDays = templates.map((t) => t.dayOfWeek);
  const uniqueHours = [
    ...new Set(
      hasCustomSchedule
        ? templates.map(
            (t) =>
              `${t.startTime?.slice(0, 5) ?? "09:00"}—${
                t.endTime?.slice(0, 5) ?? "18:00"
              }`
          )
        : []
    ),
  ];
  const summary =
    hasCustomSchedule && uniqueHours.length === 1
      ? `${compactDayRanges(workingDays, dayShort)} ${uniqueHours[0]}`
      : hasCustomSchedule
      ? uniqueHours
          .slice(0, 2)
          .map((hours) => {
            const matching = templates
              .filter(
                (t) =>
                  `${t.startTime?.slice(0, 5) ?? "09:00"}—${
                    t.endTime?.slice(0, 5) ?? "18:00"
                  }` === hours
              )
              .map((t) => t.dayOfWeek);
            return `${compactDayRanges(matching, dayShort)} ${hours}`;
          })
          .join(", ")
      : "";

  const upcomingBlockCount = overrides.filter(
    (o) => o.date >= new Date().toISOString().slice(0, 10)
  ).length;

  return (
    <div
      className={`flex items-center justify-between gap-4 p-3.5 sm:p-4 rounded-xl bg-card border transition-all shadow-2xs hover:shadow-xs ${
        isScheduling
          ? "border-primary ring-2 ring-primary/20 shadow-xs"
          : "border-border/80 hover:border-border"
      }`}
    >
      <div className="flex items-center gap-3.5 min-w-0">
        <EntityAvatar
          name={staff.name}
          src={staff.avatarUrl ?? undefined}
          size="md"
        />
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-semibold text-sm text-foreground truncate">
              {staff.name}
            </h4>
            {hasCustomSchedule ? (
              <span className="flex items-center gap-1 text-[11px] font-semibold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full">
                <User className="w-3 h-3" />
                {t("team.shifts_custom_schedule")}
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                <Building2 className="w-3 h-3" />
                {t("team.shifts_inherited_schedule")}
              </span>
            )}
          </div>
          {isLoading ? (
            <div className="h-3 w-40 rounded bg-muted/60 animate-pulse" />
          ) : hasCustomSchedule ? (
            <p className="text-xs text-muted-foreground truncate tabular-nums">
              {summary}
              {upcomingBlockCount > 0 && (
                <span className="font-semibold text-destructive/80 ml-2">
                  +{upcomingBlockCount}
                </span>
              )}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground truncate">
              {t("team.shifts_follows_business_hours")}
            </p>
          )}
        </div>
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={onSchedule}
        leftIcon={<Clock className="w-3.5 h-3.5 text-primary" />}
        className="text-xs h-8 px-2.5 sm:px-3 border-border/80 font-medium shrink-0"
      >
        {t("team.edit_schedule")}
      </Button>
    </div>
  );
}

export function TeamShiftsTab() {
  const t = useTranslations("dashboard");
  const { staff, isLoading } = useStaff(true);
  const [schedulingStaff, setSchedulingStaff] = useState<StaffDto | null>(null);

  return (
    <div className="space-y-4">
      <div className="space-y-2.5">
        {isLoading && (
          <div className="space-y-2.5">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-20 rounded-xl bg-card border border-border/60 animate-pulse"
              />
            ))}
          </div>
        )}

        {!isLoading && staff.length === 0 && (
          <EmptyState
            icon={<User className="w-6 h-6" />}
            title={t("team.shifts_empty_title")}
            description={t("team.shifts_empty_desc")}
          />
        )}

        {staff.map((member) => (
          <ShiftsShiftRow
            key={member.id}
            staff={member}
            isScheduling={schedulingStaff?.id === member.id}
            onSchedule={() => setSchedulingStaff(member)}
          />
        ))}
      </div>

      <AvailabilityModal
        staff={schedulingStaff}
        isOpen={Boolean(schedulingStaff)}
        onClose={() => setSchedulingStaff(null)}
      />
    </div>
  );
}
