"use client";

import React from "react";
import { motion } from "motion/react";
import { TopObjectionItemDto } from "@/types/insights";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslations } from "next-intl";

interface TopObjectionsChartProps {
  data?: TopObjectionItemDto[];
  isLoading?: boolean;
}

const OBJECTION_KEYS: Record<
  string,
  "price_too_high" | "no_evening_slots" | "no_parking_info" | "preferred_master_busy" | "competitor_chosen"
> = {
  PRICE_TOO_HIGH: "price_too_high",
  NO_EVENING_SLOTS: "no_evening_slots",
  NO_PARKING_INFO: "no_parking_info",
  PREFERRED_MASTER_BUSY: "preferred_master_busy",
  COMPETITOR_CHOSEN: "competitor_chosen",
};

export function TopObjectionsChart({ data = [], isLoading = false }: TopObjectionsChartProps) {
  const t = useTranslations("insights");

  return (
    <div className="p-4 rounded-xl border border-border/70 bg-card space-y-3">
      <div>
        <h3 className="text-sm font-semibold text-foreground">{t("demand.objections_title")}</h3>
        <p className="text-xs text-muted-foreground mt-0.5">{t("demand.objections_desc")}</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-1.5">
              <Skeleton className="h-3 w-36 rounded-full" />
              <Skeleton className="h-2 w-full rounded-full" />
            </div>
          ))}
        </div>
      ) : data.length === 0 ? (
        <p className="text-xs text-muted-foreground py-6 text-center">
          {t("demand.objections_empty")}
        </p>
      ) : (
        <div className="space-y-3">
          {data.map((item, idx) => {
            const key = OBJECTION_KEYS[item.reason];
            const label = key ? t(`demand.objections.${key}`) : item.reason;

            return (
              <div key={item.reason} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-foreground truncate max-w-[220px]">{label}</span>
                  <div className="flex items-center gap-1.5 text-[11px] font-mono shrink-0">
                    <span className="font-bold text-foreground">{item.count}</span>
                    <span className="text-muted-foreground">{item.percentage}%</span>
                  </div>
                </div>
                <div className="h-1.5 w-full bg-muted/60 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.max(item.percentage, 4)}%` }}
                    transition={{ duration: 0.45, delay: idx * 0.07, ease: "easeOut" }}
                    className="h-full rounded-full bg-rose-500"
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
