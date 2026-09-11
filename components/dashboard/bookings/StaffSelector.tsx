"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { EntityAvatar } from "@/components/dashboard/shared/EntityAvatar";
import type { StaffDto } from "@/lib/api/staff";
import clsx from "clsx";

interface StaffSelectorProps {
  staffList: StaffDto[];
  selectedStaffId?: string;
  onSelect: (staffId?: string) => void;
}

export function StaffSelector({
  staffList,
  selectedStaffId,
  onSelect,
}: StaffSelectorProps) {
  const t = useTranslations("dashboard");

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
      <button
        type="button"
        onClick={() => onSelect(undefined)}
        className={clsx(
          "px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border",
          !selectedStaffId
            ? "bg-primary text-primary-foreground border-primary shadow-xs"
            : "bg-card border-border/60 text-muted-foreground hover:text-foreground"
        )}
      >
        {t("bookings.filter_all_staff")}
      </button>

      {staffList.map((member) => {
        const isSelected = selectedStaffId === member.id;
        return (
          <button
            key={member.id}
            type="button"
            onClick={() => onSelect(member.id)}
            className={clsx(
              "flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border",
              isSelected
                ? "bg-primary text-primary-foreground border-primary shadow-xs"
                : "bg-card border-border/60 text-muted-foreground hover:text-foreground"
            )}
          >
            <EntityAvatar name={member.name} size="xs" />
            <span>{member.name}</span>
          </button>
        );
      })}
    </div>
  );
}
