"use client";

import React from "react";
import { motion } from "motion/react";
import { UnmetServiceItemDto } from "@/types/insights";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslations } from "next-intl";

interface UnmetServicesChartProps {
  data?: UnmetServiceItemDto[];
  isLoading?: boolean;
}

export function UnmetServicesChart({ data = [], isLoading = false }: UnmetServicesChartProps) {
  const t = useTranslations("insights");
  const maxInquiries = Math.max(...data.map((d) => d.inquiries), 1);

  return (
    <div className="p-4 rounded-xl border border-border/70 bg-card space-y-3">
      <div>
        <h3 className="text-sm font-semibold text-foreground">{t("demand.unmet_title")}</h3>
        <p className="text-xs text-muted-foreground mt-0.5">{t("demand.unmet_desc")}</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-1.5">
              <Skeleton className="h-3 w-32 rounded-full" />
              <Skeleton className="h-2 w-full rounded-full" />
            </div>
          ))}
        </div>
      ) : data.length === 0 ? (
        <p className="text-xs text-muted-foreground py-6 text-center">
          {t("demand.unmet_empty")}
        </p>
      ) : (
        <div className="space-y-3">
          {data.map((item, idx) => {
            const widthPct = Math.round((item.inquiries / maxInquiries) * 100);
            return (
              <div key={item.service} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-foreground truncate max-w-[200px]">{item.service}</span>
                  <div className="flex items-center gap-2 text-[11px] font-mono shrink-0">
                    <span className="text-primary font-bold">{item.inquiries}</span>
                    <span className="text-rose-600">{item.lostLeads} {t("demand.unmet_lost_suffix")}</span>
                  </div>
                </div>
                <div className="h-1.5 w-full bg-muted/60 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.max(widthPct, 4)}%` }}
                    transition={{ duration: 0.45, delay: idx * 0.07, ease: "easeOut" }}
                    className="h-full rounded-full bg-primary"
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
