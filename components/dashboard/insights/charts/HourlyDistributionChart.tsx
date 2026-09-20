"use client";

import React from "react";
import { motion } from "motion/react";
import { HourlyDistributionItemDto } from "@/types/insights";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock } from "lucide-react";
import { useTranslations } from "next-intl";

interface HourlyDistributionChartProps {
  data?: HourlyDistributionItemDto[];
  isLoading?: boolean;
}

export function HourlyDistributionChart({ data = [], isLoading = false }: HourlyDistributionChartProps) {
  const t = useTranslations("insights");
  const maxInquiries = Math.max(...data.map((d) => d.inquiries), 1);
  const offHoursTraffic = data.filter((d) => !d.isWorkingHour && d.inquiries > 0)
    .reduce((acc, d) => acc + d.inquiries, 0);

  return (
    <div className="p-4 rounded-xl border border-border/70 bg-card space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">{t("demand.hourly_title")}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{t("demand.hourly_desc")}</p>
        </div>
        {/* Compact legend */}
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground shrink-0 pt-0.5">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-primary" />
            {t("demand.legend_open")}
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            {t("demand.legend_closed")}
          </span>
          {offHoursTraffic > 0 && (
            <span className="font-semibold text-amber-600">
              {t("demand.off_hours_count", { count: offHoursTraffic })}
            </span>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="h-28 flex items-end gap-1 pt-2">
          {[...Array(12)].map((_, i) => (
            <Skeleton key={i} className="flex-1 h-20 rounded-t-sm" />
          ))}
        </div>
      ) : data.length === 0 ? (
        <p className="text-xs text-muted-foreground py-6 text-center">
          {t("demand.hourly_empty")}
        </p>
      ) : (
        <div className="space-y-2">
          {/* Bar chart */}
          <div className="h-28 flex items-end gap-1 sm:gap-1.5">
            {data.map((item, idx) => {
              const heightPct = Math.round((item.inquiries / maxInquiries) * 100);
              return (
                <div key={item.hour} className="flex-1 flex flex-col items-center gap-0.5 group relative">
                  {/* Tooltip */}
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 hidden group-hover:flex px-1.5 py-0.5 rounded bg-slate-900 text-white text-[10px] whitespace-nowrap z-10 pointer-events-none shadow-sm">
                    {item.hour}:00 — {item.inquiries}
                  </div>
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${Math.max(heightPct, 4)}%` }}
                    transition={{ duration: 0.4, delay: idx * 0.015, ease: "easeOut" }}
                    className={`w-full rounded-t-sm ${item.isWorkingHour ? "bg-primary" : "bg-amber-500"}`}
                  />
                  <span className="text-[9px] text-muted-foreground font-mono">{item.hour}</span>
                </div>
              );
            })}
          </div>

          {/* Off-hours hint */}
          {offHoursTraffic > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
              <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>{t("demand.off_hours_hint")}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
