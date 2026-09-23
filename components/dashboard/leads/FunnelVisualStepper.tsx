"use client";

import React from "react";
import { ArrowRight, Inbox, UserCheck, CalendarCheck, CheckCircle2, TrendingDown } from "lucide-react";
import { useTranslations } from "next-intl";
import clsx from "clsx";
import type { FunnelStageDto, LeadStatus } from "@/lib/api/leads";

const stageIcons: Record<LeadStatus, React.ElementType> = {
  NEW: Inbox,
  QUALIFIED: UserCheck,
  APPOINTMENT_SET: CalendarCheck,
  DEAL_WON: CheckCircle2,
  DEAL_LOST: TrendingDown,
};

interface FunnelVisualStepperProps {
  funnel: FunnelStageDto[];
  totalLeads: number;
}

export function FunnelVisualStepper({ funnel, totalLeads }: FunnelVisualStepperProps) {
  const t = useTranslations("dashboard");

  const stageLabel = (stage: LeadStatus) => {
    switch (stage) {
      case "NEW":
        return t("leads.stage_new");
      case "QUALIFIED":
        return t("leads.stage_qualified");
      case "APPOINTMENT_SET":
        return t("leads.stage_appointment_set");
      case "DEAL_WON":
        return t("leads.stage_won");
      case "DEAL_LOST":
        return t("leads.stage_lost");
      default:
        return stage;
    }
  };

  return (
    <div className="rounded-xl border border-border/80 bg-card p-4 sm:p-5 shadow-2xs space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t("leads.funnel_visual_title")}
        </h3>
        <span className="text-xs font-mono text-muted-foreground">
          {totalLeads} {t("leads.funnel_leads_count")}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {funnel.map((item, idx) => {
          const Icon = stageIcons[item.stage] || Inbox;
          const isWon = item.stage === "DEAL_WON";
          const share = totalLeads > 0 ? ((item.count / totalLeads) * 100).toFixed(1) : "0.0";
          const isLast = idx === funnel.length - 1;

          return (
            <div
              key={item.stage}
              className="relative p-3.5 rounded-lg bg-muted/30 border border-border/60 space-y-2.5 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={clsx(
                      "w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold font-mono border",
                      isWon
                        ? "bg-emerald-50 text-emerald-600 border-emerald-200/60 dark:bg-emerald-950/30"
                        : "bg-primary/10 text-primary border-primary/20"
                    )}
                  >
                    {idx + 1}
                  </div>
                  <span className="text-xs font-semibold text-foreground truncate">
                    {stageLabel(item.stage)}
                  </span>
                </div>
                <Icon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              </div>

              <div>
                <div className="text-lg font-bold text-foreground font-mono tabular-nums">
                  {item.count}
                </div>
                <div className="text-[11px] text-muted-foreground font-mono">
                  {share}% {t("leads.funnel_share_suffix")}
                </div>
              </div>

              {/* Step micro-bar */}
              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className={clsx(
                    "h-full rounded-full transition-all",
                    isWon ? "bg-emerald-500" : "bg-primary"
                  )}
                  style={{
                    width: item.count === 0 ? "0%" : `${Math.max(Number(share), 3)}%`,
                  }}
                />
              </div>

              {/* Conversion indicator to next */}
              {!isLast && item.conversionToNext !== null && (
                <div className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground pt-0.5">
                  <ArrowRight className="w-3 h-3 text-primary" />
                  <span>
                    {t("leads.funnel_conversion_step")}:{" "}
                    <strong className="text-foreground font-mono font-semibold">
                      {item.conversionToNext.toFixed(1)}%
                    </strong>
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
