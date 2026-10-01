"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { SectionCard } from "@/components/dashboard/shared/SectionCard";
import { EntityAvatar } from "@/components/dashboard/shared/EntityAvatar";
import { Skeleton } from "@/components/ui/skeleton";
import type { StaffPerformanceItem } from "@/lib/api/analytics";

interface StaffWorkloadTableProps {
  staffList?: StaffPerformanceItem[];
  isLoading?: boolean;
}

export function StaffWorkloadTable({ staffList = [], isLoading = false }: StaffWorkloadTableProps) {
  const t = useTranslations("dashboard");

  const safeStaffList: StaffPerformanceItem[] = Array.isArray(staffList)
    ? staffList
    : Array.isArray((staffList as unknown as { data?: StaffPerformanceItem[] })?.data)
    ? (staffList as unknown as { data: StaffPerformanceItem[] }).data
    : [];

  return (
    <SectionCard
      title={t("overview.staff_workload_title")}
      description={t("overview.staff_workload_desc")}
      className="h-full flex flex-col justify-between"
    >
      <div className="overflow-x-auto pt-1">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-border/70 text-[11px] font-medium text-muted-foreground">
              <th className="pb-2.5 font-medium">{t("overview.specialist_col")}</th>
              <th className="pb-2.5 font-medium text-center">{t("overview.total_bookings_col")}</th>
              <th className="pb-2.5 font-medium text-right">{t("overview.completed_col")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {isLoading ? (
              [1, 2, 3].map((i) => (
                <tr key={i}>
                  <td className="py-2.5">
                    <div className="flex items-center gap-2.5">
                      <Skeleton className="h-6 w-6 rounded-full" />
                      <Skeleton className="h-3 w-24 rounded-full" />
                    </div>
                  </td>
                  <td className="py-2.5 text-center">
                    <Skeleton className="h-3 w-8 rounded-full mx-auto" />
                  </td>
                  <td className="py-2.5 text-right">
                    <Skeleton className="h-3 w-8 rounded-full ml-auto" />
                  </td>
                </tr>
              ))
            ) : safeStaffList.length === 0 ? (
              <tr>
                <td colSpan={3} className="py-8 text-center text-xs text-muted-foreground">
                  {t("common.empty_data")}
                </td>
              </tr>
            ) : (
              safeStaffList.map((staff) => (
                <tr key={staff.staffId} className="hover:bg-muted/20 transition-colors">
                  <td className="py-2.5">
                    <div className="flex items-center gap-2.5">
                      <EntityAvatar name={staff.staffName} size="xs" />
                      <span className="font-medium text-foreground text-xs">{staff.staffName}</span>
                    </div>
                  </td>
                  <td className="py-2.5 text-center font-mono text-xs text-foreground tabular-nums">
                    {staff.totalBookings}
                  </td>
                  <td className="py-2.5 text-right font-mono text-xs text-foreground font-semibold tabular-nums">
                    {staff.completedBookings}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}
