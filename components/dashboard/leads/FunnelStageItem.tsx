"use client";

import React from "react";
import {
  Clock,
  ArrowDown,
  UserCheck,
  CalendarCheck,
  CheckCircle2,
  Inbox,
  TrendingDown,
} from "lucide-react";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import clsx from "clsx";
import type { FunnelStageDto, LeadStatus } from "@/lib/api/leads";

const stageConfig: Record<
  LeadStatus,
  { icon: React.ElementType; isWon?: boolean }
> = {
  NEW: { icon: Inbox },
  QUALIFIED: { icon: UserCheck },
  APPOINTMENT_SET: { icon: CalendarCheck },
  DEAL_WON: { icon: CheckCircle2, isWon: true },
  DEAL_LOST: { icon: TrendingDown },
};

interface FunnelStageItemProps {
  item: FunnelStageDto;
  index: number;
  isLast: boolean;
  totalLeads: number;
}

export function FunnelStageItem({
  item,
  index,
  isLast,
  totalLeads,
}: FunnelStageItemProps) {
  const t = useTranslations("dashboard");
  const config = stageConfig[item.stage] || stageConfig.NEW;
  const Icon = config.icon;
  const isWon = Boolean(config.isWon);

  const widthPct =
    totalLeads > 0 ? Math.round((item.count / totalLeads) * 100) : 0;
  const sharePct = totalLeads > 0 ? ((item.count / totalLeads) * 100).toFixed(1) : "0.0";

  const stageLabel = {
    NEW: t("leads.stage_new"),
    QUALIFIED: t("leads.stage_qualified"),
    APPOINTMENT_SET: t("leads.stage_appointment_set"),
    DEAL_WON: t("leads.stage_won"),
    DEAL_LOST: t("leads.stage_lost"),
  }[item.stage] || item.stage;

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return "—";
    if (minutes < 60) return `${Math.round(minutes)} ${t("leads.funnel_min_suffix")}`;
    if (minutes < 1440) return `${(minutes / 60).toFixed(1)} ${t("leads.funnel_hours_suffix")}`;
    return `${(minutes / 1440).toFixed(1)} ${t("leads.funnel_days_suffix")}`;
  };

  const conversionRate = item.conversionToNext !== null ? item.conversionToNext : 0;
  const dropoffRate = item.dropoffRate !== null ? item.dropoffRate : 0;

  return (
    <div className="relative">
      {/* Stage Card */}
      <div className="rounded-xl border border-border/80 bg-card p-4 sm:p-5 shadow-2xs hover:border-primary/30 transition-all space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={clsx(
                "w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs font-mono border",
                isWon
                  ? "bg-emerald-50 text-emerald-600 border-emerald-200/60 dark:bg-emerald-950/30"
                  : "bg-primary/10 text-primary border-primary/20"
              )}
            >
              {index + 1}
            </div>

            <div className="p-1.5 rounded-lg bg-muted text-foreground">
              <Icon className="w-4 h-4" />
            </div>

            <div>
              <h4 className="text-sm font-semibold text-foreground tracking-tight">
                {stageLabel}
              </h4>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                <Clock className="w-3 h-3 text-muted-foreground/70" />
                <span>
                  {t("leads.funnel_avg_duration")}: {formatDuration(item.avgDurationMinutes)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-baseline gap-2 sm:text-right">
            <span className="text-xl sm:text-2xl font-bold text-foreground font-mono tabular-nums">
              {item.count}
            </span>
            <span className="text-xs text-muted-foreground font-mono">
              {sharePct}% {t("leads.funnel_share_suffix")}
            </span>
          </div>
        </div>

        {/* Proportional Volume Bar */}
        <div className="h-2 w-full bg-muted/50 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{
              width: item.count === 0 ? "0%" : `${Math.max(widthPct, 2)}%`,
            }}
            transition={{ duration: 0.4, ease: "easeOut", delay: index * 0.05 }}
            className={clsx(
              "h-full rounded-full transition-all",
              isWon ? "bg-emerald-500" : "bg-primary"
            )}
          />
        </div>
      </div>

      {/* Inter-Stage Conversion Connector */}
      {!isLast && (
        <div className="flex items-center justify-center my-2 relative">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-card border border-border/80 shadow-2xs text-xs font-medium z-10">
            <span className="inline-flex items-center gap-1 text-primary">
              <ArrowDown className="w-3 h-3" />
              <span>
                {t("leads.funnel_conversion_step")}: {conversionRate.toFixed(1)}%
              </span>
            </span>

            {dropoffRate > 0 && (
              <>
                <span className="text-border">|</span>
                <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400">
                  <span>
                    {t("leads.funnel_dropoff_step")}: -{dropoffRate.toFixed(1)}%
                  </span>
                </span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
