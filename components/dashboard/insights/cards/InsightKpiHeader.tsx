"use client";

import React from "react";
import { AlertCircle, Users, BarChart2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { RecommendationsSummaryResponseDto, InsightCategory } from "@/types/insights";
import { Skeleton } from "@/components/ui/skeleton";

interface InsightKpiHeaderProps {
  summary?: RecommendationsSummaryResponseDto;
  isLoading?: boolean;
}

const CATEGORY_KEYS: Record<
  InsightCategory,
  "service_expansion" | "schedule_optimization" | "pricing_and_packaging" | "knowledge_gap" | "staff_balancing" | "marketing_insight"
> = {
  SERVICE_EXPANSION: "service_expansion",
  SCHEDULE_OPTIMIZATION: "schedule_optimization",
  PRICING_AND_PACKAGING: "pricing_and_packaging",
  KNOWLEDGE_GAP: "knowledge_gap",
  STAFF_BALANCING: "staff_balancing",
  MARKETING_INSIGHT: "marketing_insight",
};

export function InsightKpiHeader({ summary, isLoading }: InsightKpiHeaderProps) {
  const t = useTranslations("insights");

  const topCategory = React.useMemo(() => {
    if (!summary?.categoryBreakdown) return null;
    let maxKey: InsightCategory | null = null;
    let maxVal = -1;
    for (const [k, v] of Object.entries(summary.categoryBreakdown)) {
      if (v && v > maxVal) {
        maxVal = v;
        maxKey = k as InsightCategory;
      }
    }
    return maxKey ? { key: maxKey, count: maxVal } : null;
  }, [summary]);

  if (isLoading) {
    return (
      <div className="flex items-center gap-6 py-2 border-b border-border/50">
        <Skeleton className="h-4 w-32 rounded-full" />
        <Skeleton className="h-4 w-28 rounded-full" />
        <Skeleton className="h-4 w-36 rounded-full" />
      </div>
    );
  }

  const activeCount = summary?.totalActive ?? 0;
  const lostLeads = summary?.estimatedLostLeadsTotal ?? 0;

  return (
    <div className="flex items-center gap-6 py-2 border-b border-border/50 flex-wrap">
      {/* Active improvements */}
      <div className="flex items-center gap-1.5 text-xs">
        <AlertCircle className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        <span className="text-muted-foreground">{t("kpi.active_improvements")}:</span>
        <span className="font-bold text-foreground font-mono tabular-nums">{activeCount}</span>
        {summary?.highImpactCount ? (
          <span className="text-[11px] text-muted-foreground">
            ({summary.highImpactCount} {t("kpi.require_attention")})
          </span>
        ) : null}
      </div>

      <span className="text-border/80 select-none">·</span>

      {/* Lost leads */}
      <div className="flex items-center gap-1.5 text-xs">
        <Users className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        <span className="text-muted-foreground">{t("kpi.lost_leads")}:</span>
        <span
          className={`font-bold font-mono tabular-nums ${
            lostLeads > 0 ? "text-rose-600" : "text-foreground"
          }`}
        >
          {lostLeads}
        </span>
      </div>

      <span className="text-border/80 select-none">·</span>

      {/* Key friction */}
      <div className="flex items-center gap-1.5 text-xs">
        <BarChart2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        <span className="text-muted-foreground">{t("kpi.key_friction")}:</span>
        <span className="font-semibold text-foreground">
          {topCategory ? t(`rec.category.${CATEGORY_KEYS[topCategory.key]}`) : t("kpi.no_anomalies")}
        </span>
      </div>
    </div>
  );
}
