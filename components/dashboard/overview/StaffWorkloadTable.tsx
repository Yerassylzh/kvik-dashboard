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

  return (
    <SectionCard
      title={t("overview.staff_workload_title")}
      description={t("overview.staff_workload_desc")}
      className="h-full"
    >
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border/60 text-xs text-muted-foreground">
              <th className="pb-2.5 font-medium">Специалист</th>
              <th className="pb-2.5 font-medium text-center">Всего записей</th>
              <th className="pb-2.5 font-medium text-center">Выполнено</th>
              <th className="pb-2.5 font-medium text-right">{t("overview.staff_completion_rate")}</th>
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
                  <td className="py-2.5 text-center">
                    <Skeleton className="h-3 w-8 rounded-full mx-auto" />
                  </td>
                  <td className="py-2.5 text-right">
                    <Skeleton className="h-3 w-12 rounded-full ml-auto" />
                  </td>
                </tr>
              ))
            ) : staffList.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-6 text-center text-xs text-muted-foreground">
                  {t("common.empty_data")}
                </td>
              </tr>
            ) : (
              staffList.map((staff) => {
                const rate =
                  staff.totalBookings > 0
                    ? `${Math.round((staff.completedBookings / staff.totalBookings) * 100)}%`
                    : "—";

                return (
                  <tr key={staff.staffId} className="hover:bg-muted/30 transition-colors">
                    <td className="py-2.5">
                      <div className="flex items-center gap-2.5">
                        <EntityAvatar name={staff.staffName} size="xs" />
                        <span className="font-medium text-foreground text-xs">{staff.staffName}</span>
                      </div>
                    </td>
                    <td className="py-2.5 text-center font-mono text-xs text-foreground">
                      {staff.totalBookings}
                    </td>
                    <td className="py-2.5 text-center font-mono text-xs text-emerald-500 font-semibold">
                      {staff.completedBookings}
                    </td>
                    <td className="py-2.5 text-right font-mono text-xs text-foreground font-semibold">
                      {rate}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}
