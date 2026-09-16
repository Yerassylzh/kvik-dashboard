"use client";

import React from "react";
import Link from "next/link";
import { Bot, Sparkles, ArrowUpRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { AnalyticsOverviewResponse } from "@/lib/api/analytics";

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
    <div className="rounded-xl border border-border/80 bg-card p-4 sm:p-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0">
            <Bot className="w-5 h-5" />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold text-sm text-foreground">{t("overview.ai_status_title")}</h3>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200/70 px-2 py-0.5 rounded-full whitespace-nowrap shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span>{t("overview.ai_status_online")}</span>
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              {t("overview.ai_active_desc")}
            </p>
          </div>
        </div>

        <Link href="/ai-studio" className="shrink-0 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            rightIcon={<ArrowUpRight className="w-3.5 h-3.5 text-primary" />}
            className="w-full sm:w-auto justify-center text-xs whitespace-nowrap shrink-0"
          >
            {t("overview.ai_test_dialogue")}
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-3 mt-4 pt-3.5 border-t border-border/70 text-center">
        <div className="p-2.5 rounded-lg bg-muted/40 flex flex-col items-center justify-center">
          <div className="text-xs font-medium text-muted-foreground">{t("overview.automation_rate")}</div>
          {isLoading ? (
            <Skeleton className="h-6 w-14 rounded-md mt-1" />
          ) : (
            <div className="text-lg font-bold text-foreground mt-0.5 tabular-nums">
              {automationRate}%
            </div>
          )}
        </div>
        <div className="p-2.5 rounded-lg bg-muted/40 flex flex-col items-center justify-center">
          <div className="text-xs font-medium text-muted-foreground">{t("overview.bot_answers")}</div>
          {isLoading ? (
            <Skeleton className="h-6 w-12 rounded-md mt-1" />
          ) : (
            <div className="text-lg font-bold text-foreground mt-0.5 tabular-nums">
              {botHandled}
            </div>
          )}
        </div>
        <div className="p-2.5 rounded-lg bg-muted/40 flex flex-col items-center justify-center">
          <div className="text-xs font-medium text-muted-foreground">{t("overview.intercepts")}</div>
          {isLoading ? (
            <Skeleton className="h-6 w-12 rounded-md mt-1" />
          ) : (
            <div className="text-lg font-bold text-foreground mt-0.5 tabular-nums">
              {intercepted}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
