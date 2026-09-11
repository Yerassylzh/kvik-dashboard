"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { SectionCard } from "@/components/dashboard/shared/SectionCard";
import { EntityAvatar } from "@/components/dashboard/shared/EntityAvatar";
import type { StaffPerformanceItem } from "@/lib/api/analytics";

interface StaffWorkloadTableProps {
  staffList?: StaffPerformanceItem[];
  isLoading?: boolean;
}

export function StaffWorkloadTable({ staffList = [], isLoading }: StaffWorkloadTableProps) {
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
              <th className="pb-2.5 font-medium text-right">Выручка</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {staffList.length === 0 && !isLoading && (
              <tr>
                <td colSpan={4} className="py-6 text-center text-xs text-muted-foreground">
                  {t("common.empty_data")}
                </td>
              </tr>
            )}

            {staffList.map((staff) => (
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
                  {Number(staff.estimatedRevenue || 0).toLocaleString("ru-RU")}{" "}
                  {t("common.currency")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}
