"use client";

import React, { useState } from "react";
import {
  MessageSquareQuote,
  Zap,
  XCircle,
  Users,
  UserX,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { RecommendationItemDto, InsightCategory, InsightImpact, RecommendationStatus } from "@/types/insights";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface RecommendationCardProps {
  recommendation: RecommendationItemDto;
  onViewQuotes: (rec: RecommendationItemDto) => void;
  onApply: (rec: RecommendationItemDto) => void;
  onDismiss: (rec: RecommendationItemDto) => void;
}

const CATEGORY_CONFIG: Record<
  InsightCategory,
  {
    key: "service_expansion" | "schedule_optimization" | "pricing_and_packaging" | "knowledge_gap" | "staff_balancing" | "marketing_insight";
    variant: "default" | "secondary" | "outline" | "success" | "warning" | "destructive" | "primary" | "info";
  }
> = {
  SERVICE_EXPANSION: { key: "service_expansion", variant: "primary" },
  SCHEDULE_OPTIMIZATION: { key: "schedule_optimization", variant: "warning" },
  PRICING_AND_PACKAGING: { key: "pricing_and_packaging", variant: "destructive" },
  KNOWLEDGE_GAP: { key: "knowledge_gap", variant: "info" },
  STAFF_BALANCING: { key: "staff_balancing", variant: "secondary" },
  MARKETING_INSIGHT: { key: "marketing_insight", variant: "default" },
};

const IMPACT_CONFIG: Record<
  InsightImpact,
  {
    key: "high" | "medium" | "low";
    dotColor: string;
    badgeVariant: "destructive" | "warning" | "secondary";
  }
> = {
  HIGH: { key: "high", dotColor: "bg-rose-500", badgeVariant: "destructive" },
  MEDIUM: { key: "medium", dotColor: "bg-amber-500", badgeVariant: "warning" },
  LOW: { key: "low", dotColor: "bg-slate-400", badgeVariant: "secondary" },
};

const STATUS_CONFIG: Record<
  RecommendationStatus,
  {
    key: "new" | "accepted" | "implemented" | "dismissed" | "all";
    className: string;
  }
> = {
  NEW: { key: "new", className: "bg-blue-50 text-blue-700 border-blue-200" },
  ACCEPTED: { key: "accepted", className: "bg-amber-50 text-amber-700 border-amber-200" },
  IMPLEMENTED: { key: "implemented", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  DISMISSED: { key: "dismissed", className: "bg-muted text-muted-foreground border-border/80" },
  ALL: { key: "all", className: "bg-muted text-muted-foreground border-border/80" },
};

export function RecommendationCard({
  recommendation,
  onViewQuotes,
  onApply,
  onDismiss,
}: RecommendationCardProps) {
  const t = useTranslations("insights");
  const [isExpanded, setIsExpanded] = useState(false);

  const categoryConf = CATEGORY_CONFIG[recommendation.category] || {
    key: "service_expansion" as const,
    variant: "secondary" as const,
  };
  const impactConf = IMPACT_CONFIG[recommendation.impact] || IMPACT_CONFIG.MEDIUM;
  const statusConf = STATUS_CONFIG[recommendation.status] || STATUS_CONFIG.NEW;

  const categoryLabel = t(`rec.category.${categoryConf.key}`);
  const impactLabel = t(`rec.impact_label.${impactConf.key}`);
  const statusLabel = t(`rec.status_badge.${statusConf.key}`);

  const isResolved = recommendation.status === "IMPLEMENTED" || recommendation.status === "DISMISSED";
  const quotesCount = recommendation.sampleQuotes?.length || recommendation.uniqueClientsCount;

  return (
    <div
      className={cn(
        "p-4 sm:p-5 rounded-xl border bg-card transition-all duration-150 space-y-3.5 shadow-2xs",
        isResolved ? "opacity-75 border-border/60 bg-muted/20" : "border-border/80 hover:border-border"
      )}
    >
      {/* Header Tags & Metadata */}
      <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant={impactConf.badgeVariant} className="text-[11px] font-semibold flex items-center gap-1.5">
            <span className={cn("w-1.5 h-1.5 rounded-full animate-pulse", impactConf.dotColor)} />
            {impactLabel}
          </Badge>

          <Badge variant={categoryConf.variant} className="text-[11px]">
            {categoryLabel}
          </Badge>
        </div>

        <div className="flex items-center gap-2 text-[11px]">
          <span className={cn("px-2 py-0.5 rounded-md border font-medium", statusConf.className)}>
            {statusLabel}
          </span>
        </div>
      </div>

      {/* Main Title & Executive Summary */}
      <div className="space-y-1">
        <h3 className="text-sm sm:text-base font-bold text-foreground leading-snug">
          {recommendation.title}
        </h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {recommendation.executiveSummary}
        </p>
      </div>

      {/* Collapsible Diagnosis */}
      {recommendation.problemDiagnosis && (
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="flex items-center gap-1 text-[11px] font-medium text-primary hover:underline cursor-pointer select-none"
          >
            <span>{isExpanded ? t("rec.collapse_diagnosis") : t("rec.expand_diagnosis")}</span>
            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
          {isExpanded && (
            <div className="p-3 rounded-lg bg-muted/40 border border-border/60 text-xs text-muted-foreground leading-relaxed mt-1.5 animate-in fade-in-50 duration-150">
              {recommendation.problemDiagnosis}
            </div>
          )}
        </div>
      )}

      {/* Factual Quantified Evidence */}
      <div className="flex items-center gap-3 pt-1 border-t border-border/50 text-xs flex-wrap">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Users className="w-3.5 h-3.5 text-primary" />
          <span>{t("rec.clients_contacted")}</span>
          <span className="font-bold text-foreground font-mono tabular-nums">
            {recommendation.uniqueClientsCount} {t("rec.clients_unit")}
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-muted-foreground">
          <UserX className="w-3.5 h-3.5 text-rose-500" />
          <span>{t("rec.leads_lost")}</span>
          <span className="font-bold text-rose-600 font-mono tabular-nums">
            {recommendation.lostLeadsCount} {t("rec.leads_unit")}
          </span>
        </div>
      </div>

      {/* Action Toolbar */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/60 flex-wrap">
        {/* Left: View Quotes */}
        <Button
          variant="outline"
          size="sm"
          className="text-xs gap-1.5 h-8 font-medium"
          onClick={() => onViewQuotes(recommendation)}
        >
          <MessageSquareQuote className="w-3.5 h-3.5 text-muted-foreground" />
          <span>{t("actions.view_quotes", { count: quotesCount })}</span>
        </Button>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {!isResolved && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground hover:text-rose-600 h-8 font-medium"
              onClick={() => onDismiss(recommendation)}
            >
              <XCircle className="w-3.5 h-3.5 mr-1" />
              <span>{t("actions.dismiss")}</span>
            </Button>
          )}

          {recommendation.status === "IMPLEMENTED" ? (
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold px-2.5 py-1 rounded-md bg-emerald-50">
              <CheckCircle2 className="w-4 h-4" />
              <span>{t("rec.implemented_badge")}</span>
            </div>
          ) : recommendation.status === "DISMISSED" ? (
            <span className="text-xs text-muted-foreground italic px-2">
              {t("rec.dismissed_text")}
            </span>
          ) : (
            <Button
              variant="default"
              size="sm"
              className="text-xs gap-1.5 h-8 font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-2xs"
              onClick={() => onApply(recommendation)}
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>{t("actions.apply_one_click")}</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
