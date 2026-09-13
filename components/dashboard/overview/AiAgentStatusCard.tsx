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
    <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-card to-card p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="relative p-2.5 rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/25 shrink-0">
            <Bot className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
            </span>
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-bold text-sm text-foreground">{t("overview.ai_status_title")}</h3>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full whitespace-nowrap shrink-0">
                <Sparkles className="w-3 h-3" />
                <span>{t("overview.ai_status_online")}</span>
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              Автоматически обрабатывает входящие заявки и ведет запись
            </p>
          </div>
        </div>

        <Link href="/settings/ai-agent" className="shrink-0 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            rightIcon={<ArrowUpRight className="w-3.5 h-3.5 text-primary" />}
            className="w-full sm:w-auto justify-center text-xs border-primary/30 hover:bg-primary/10 whitespace-nowrap shrink-0"
          >
            {t("overview.ai_test_dialogue")}
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-border/50 text-center">
        <div className="p-2.5 rounded-xl bg-muted/40 flex flex-col items-center justify-center">
          <div className="text-xs text-muted-foreground">Автоматизация</div>
          {isLoading ? (
            <Skeleton className="h-6 w-14 rounded-md mt-1" />
          ) : (
            <div className="text-lg font-extrabold text-foreground mt-0.5 font-mono">
              {automationRate}%
            </div>
          )}
        </div>
        <div className="p-2.5 rounded-xl bg-muted/40 flex flex-col items-center justify-center">
          <div className="text-xs text-muted-foreground">Ответов ИИ</div>
          {isLoading ? (
            <Skeleton className="h-6 w-12 rounded-md mt-1" />
          ) : (
            <div className="text-lg font-extrabold text-foreground mt-0.5 font-mono">
              {botHandled}
            </div>
          )}
        </div>
        <div className="p-2.5 rounded-xl bg-muted/40 flex flex-col items-center justify-center">
          <div className="text-xs text-muted-foreground">Перехватов</div>
          {isLoading ? (
            <Skeleton className="h-6 w-12 rounded-md mt-1" />
          ) : (
            <div className="text-lg font-extrabold text-foreground mt-0.5 font-mono">
              {intercepted}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
