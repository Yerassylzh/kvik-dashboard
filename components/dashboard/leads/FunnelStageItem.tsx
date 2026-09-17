"use client";

import React from "react";
import {
  Clock,
  ArrowRight,
  UserCheck,
  CalendarCheck,
  CheckCircle2,
  Inbox,
  Filter,
  ArrowDownRight,
} from "lucide-react";
import { useTranslations } from "next-intl";
import type { FunnelStageDto, LeadStatus } from "@/lib/api/leads";

const stageConfig: Record<
  LeadStatus,
  { icon: React.ElementType; color: string; bgLight: string; border: string }
> = {
  NEW: {
    icon: Inbox,
    color: "text-blue-600 dark:text-blue-400",
    bgLight: "bg-blue-50/60 dark:bg-blue-950/20",
    border: "border-blue-200 dark:border-blue-900/50",
  },
  QUALIFIED: {
    icon: UserCheck,
    color: "text-amber-600 dark:text-amber-400",
    bgLight: "bg-amber-50/60 dark:bg-amber-950/20",
    border: "border-amber-200 dark:border-amber-900/50",
  },
  APPOINTMENT_SET: {
    icon: CalendarCheck,
    color: "text-purple-600 dark:text-purple-400",
    bgLight: "bg-purple-50/60 dark:bg-purple-950/20",
    border: "border-purple-200 dark:border-purple-900/50",
  },
  DEAL_WON: {
    icon: CheckCircle2,
    color: "text-emerald-600 dark:text-emerald-400",
    bgLight: "bg-emerald-50/60 dark:bg-emerald-950/20",
    border: "border-emerald-200 dark:border-emerald-900/50",
  },
  DEAL_LOST: {
    icon: Filter,
    color: "text-rose-600 dark:text-rose-400",
    bgLight: "bg-rose-50/60 dark:bg-rose-950/20",
    border: "border-rose-200 dark:border-rose-900/50",
  },
};

interface FunnelStageItemProps {
  item: FunnelStageDto;
  isLast: boolean;
  totalLeads: number;
}

export function FunnelStageItem({
  item,
  isLast,
  totalLeads,
}: FunnelStageItemProps) {
  const t = useTranslations("dashboard");
  const config = stageConfig[item.stage] || stageConfig.NEW;
  const Icon = config.icon;
  const widthPct = totalLeads > 0 ? Math.max(12, Math.round((item.count / totalLeads) * 100)) : 100;

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return "—";
    if (minutes < 60) return `${Math.round(minutes)} ${t("leads.funnel_min_suffix")}`;
    if (minutes < 1440) return `${(minutes / 60).toFixed(1)} ${t("leads.funnel_hours_suffix")}`;
    return `${(minutes / 1440).toFixed(1)} ${t("leads.funnel_days_suffix")}`;
  };

  return (
    <div className="space-y-2">
      <div className="p-4 rounded-2xl bg-card border border-border/70 shadow-xs hover:border-border transition-all">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${config.bgLight} ${config.color} border ${config.border}`}>
              <Icon className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-foreground">
                {t(`leads.stage_${item.stage.toLowerCase()}` as any)}
              </h4>
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5">
                <Clock className="w-3 h-3" />
                <span>
                  {t("leads.funnel_avg_duration")}: {formatDuration(item.avgDurationMinutes)}
                </span>
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className="text-xl font-bold text-foreground tabular-nums">
              {item.count}
            </div>
            <div className="text-[11px] text-muted-foreground font-mono">
              {totalLeads > 0 ? `${((item.count / totalLeads) * 100).toFixed(1)}%` : "0%"} от общего
            </div>
          </div>
        </div>

        {/* Volume bar */}
        <div className="w-full bg-muted/60 h-2.5 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${widthPct}%` }}
          />
        </div>
      </div>

      {/* Conversion / Drop-off bridge */}
      {!isLast && item.conversionToNext !== null && (
        <div className="flex items-center justify-center gap-4 py-1 text-xs font-semibold">
          <div className="flex items-center gap-1 text-primary bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20">
            <ArrowRight className="w-3 h-3" />
            <span>{t("leads.funnel_conversion")}: {item.conversionToNext.toFixed(1)}%</span>
          </div>

          {item.dropoffRate !== null && item.dropoffRate > 0 && (
            <div className="flex items-center gap-1 text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20 px-2.5 py-1 rounded-full border border-rose-200 dark:border-rose-900/50">
              <ArrowDownRight className="w-3 h-3" />
              <span>{t("leads.funnel_dropoff")}: {item.dropoffRate.toFixed(1)}%</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
