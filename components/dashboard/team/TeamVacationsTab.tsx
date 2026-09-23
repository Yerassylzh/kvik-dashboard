"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useSWRConfig } from "swr";
import { CalendarOff, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { SectionCard } from "@/components/dashboard/shared/SectionCard";
import { EmptyState } from "@/components/dashboard/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useStaff, useStaffSchedule } from "@/hooks/useStaff";
import { staffApi } from "@/lib/api/staff";
import type { StaffDto } from "@/lib/api/staff";

function VacationsStaffSection({
  staff,
  onItemsChange,
}: {
  staff: StaffDto;
  onItemsChange: (staffId: string, count: number) => void;
}) {
  const { overrides, removeOverride } = useStaffSchedule(staff.id);
  const t = useTranslations("dashboard");
  const today = new Date().toISOString().slice(0, 10);

  const upcoming = overrides
    .filter((o) => o.isBlocked && o.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date));

  useEffect(() => {
    onItemsChange(staff.id, upcoming.length);
  }, [staff.id, upcoming.length, onItemsChange]);

  const handleDelete = async (overrideId: string) => {
    try {
      await removeOverride(overrideId);
      toast.success(t("team.vacations_removed_toast"));
    } catch {
      // Error handled by global interceptor
    }
  };

  if (upcoming.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        {staff.name}
      </p>
      {upcoming.map((o) => (
        <div
          key={o.id}
          className="flex items-center justify-between gap-3 p-3 rounded-xl bg-muted/20 border border-border/50"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-14 text-center py-1.5 rounded-lg bg-card border border-border/60 shrink-0">
              <p className="text-sm font-bold text-foreground tabular-nums leading-none">
                {o.date.slice(8, 10)}
              </p>
              <p className="text-[10px] text-muted-foreground tabular-nums leading-none mt-0.5">
                {o.date.slice(5, 7)}
              </p>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-foreground leading-snug">
                {o.reason || t("team.vacations_blocked_day")}
              </p>
              <p className="text-[11px] text-muted-foreground tabular-nums leading-snug mt-0.5">
                {o.date}
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => o.id && handleDelete(o.id)}
            className="h-8 px-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
            title={t("common.delete")}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}

export function TeamVacationsTab() {
  const t = useTranslations("dashboard");
  const { staff, isLoading } = useStaff(true);
  const { mutate: globalMutate } = useSWRConfig();

  const [staffId, setStaffId] = useState("");
  const [date, setDate] = useState("");
  const [reason, setReason] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [itemsByStaff, setItemsByStaff] = useState<Record<string, number>>({});

  const totalBlocked = Object.values(itemsByStaff).reduce((acc, n) => acc + n, 0);

  const handleItemsChange = useCallback((id: string, count: number) => {
    setItemsByStaff((prev) => (prev[id] === count ? prev : { ...prev, [id]: count }));
  }, []);

  const today = new Date().toISOString().slice(0, 10);
  const canSubmit = Boolean(staffId) && Boolean(date) && date >= today;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setIsSaving(true);
    try {
      await staffApi.addOverride(staffId, {
        date,
        isBlocked: true,
        reason: reason.trim() || undefined,
      });
      toast.success(t("team.vacations_added_toast"));
      setDate("");
      setReason("");
      // Refresh every bound staff/schedule SWR key so sections update.
      globalMutate(
        (key) => Array.isArray(key) && key[0] === "staff/schedule",
        undefined,
        { revalidate: true }
      );
    } catch {
      // Error handled by global interceptor
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Block working day form */}
      <SectionCard
        title={t("team.vacations_add_title")}
        description={t("team.vacations_add_desc")}
      >
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-1">
          <div className="sm:col-span-5">
            <Select
              label={t("team.vacations_staff_label")}
              value={staffId}
              onChange={(e) => setStaffId(e.target.value)}
              options={[
                { value: "", label: t("team.vacations_staff_placeholder") },
                ...staff.map((m) => ({ value: m.id, label: m.name })),
              ]}
            />
          </div>

          <div className="sm:col-span-3">
            <Input
              label={t("team.vacations_date_label")}
              type="date"
              min={today}
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div className="sm:col-span-4">
            <Input
              label={t("team.vacations_reason_label")}
              value={reason}
              placeholder={t("team.vacations_reason_placeholder")}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-end pt-3 border-t border-border/40 mt-1">
          <Button size="sm" loading={isSaving} disabled={!canSubmit} onClick={handleSubmit}>
            {t("team.vacations_add_btn")}
          </Button>
        </div>
      </SectionCard>

      {/* Upcoming blocked days */}
      <SectionCard
        title={t("team.vacations_upcoming_title")}
        description={t("team.vacations_upcoming_desc")}
      >
        <div className="space-y-4 pt-1">
          {isLoading && (
            <div className="space-y-2.5">
              {[1, 2].map((i) => (
                <div key={i} className="h-14 rounded-xl bg-muted/40 animate-pulse" />
              ))}
            </div>
          )}

          {!isLoading && staff.length === 0 && (
            <EmptyState
              icon={<CalendarOff className="w-6 h-6" />}
              title={t("team.shifts_empty_title")}
              description={t("team.shifts_empty_desc")}
            />
          )}

          {!isLoading && staff.length > 0 && (
            <>
              {staff.map((member) => (
                <VacationsStaffSection
                  key={member.id}
                  staff={member}
                  onItemsChange={handleItemsChange}
                />
              ))}

              {totalBlocked === 0 && (
                <EmptyState
                  icon={<CalendarOff className="w-6 h-6" />}
                  title={t("team.vacations_empty_title")}
                  description={t("team.vacations_empty_desc")}
                />
              )}
            </>
          )}
        </div>
      </SectionCard>
    </div>
  );
}
