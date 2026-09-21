"use client";

import React from "react";
import { Bot } from "lucide-react";
import { useTranslations } from "next-intl";
import { Skeleton } from "@/components/ui/skeleton";
import type { AnalyticsOverviewResponse } from "@/lib/api/analytics";
import clsx from "clsx";

interface AiAgentStatusCardProps {
  overview?: AnalyticsOverviewResponse;
  isLoading?: boolean;
}

export function AiAgentStatusCard({ overview, isLoading = false }: AiAgentStatusCardProps) {
  const t = useTranslations("dashboard");

  const botHandled = overview?.conversations?.botHandled || 0;
  const intercepted = overview?.conversations?.managerIntercepted || 0;
  const total = botHandled + intercepted;
  const automationRate = total > 0 ? Math.round((botHandled / total) * 100) : 0;

  return (
    <div className="rounded-xl border border-border/80 bg-card p-3.5 sm:p-4 transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left: Assistant Identity */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0">
            <Bot className="w-4.5 h-4.5" />
          </div>

          <div className="min-w-0">
            <h3 className="font-semibold text-sm text-foreground leading-snug">
              {t("overview.ai_status_title")}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-md sm:max-w-xl">
              {t("overview.ai_active_desc")}
            </p>
          </div>
        </div>

        {/* Right: Telemetry Metrics */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 shrink-0">
          {/* Automation Rate */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/30 border border-border/50 text-xs">
            <span className="text-muted-foreground">{t("overview.automation_rate")}:</span>
            {isLoading ? (
              <Skeleton className="h-4 w-9 rounded" />
            ) : (
              <span className="font-bold text-foreground tabular-nums">{automationRate}%</span>
            )}
          </div>

          {/* AI Answers */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/30 border border-border/50 text-xs">
            <span className="text-muted-foreground">{t("overview.bot_answers")}:</span>
            {isLoading ? (
              <Skeleton className="h-4 w-7 rounded" />
            ) : (
              <span className="font-bold text-foreground tabular-nums">{botHandled}</span>
            )}
          </div>

          {/* Intercepts */}
          <div
            className={clsx(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs transition-colors",
              intercepted > 0
                ? "bg-amber-50/70 border-amber-200/80 text-amber-900"
                : "bg-muted/30 border-border/50 text-foreground"
            )}
          >
            <span className={intercepted > 0 ? "text-amber-700 font-medium" : "text-muted-foreground"}>
              {t("overview.intercepts")}:
            </span>
            {isLoading ? (
              <Skeleton className="h-4 w-7 rounded" />
            ) : (
              <span className="font-bold tabular-nums">{intercepted}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
