"use client";

import React, { useState } from "react";
import { useBusinessRecommendations } from "@/hooks/useBusinessInsights";
import { RecommendationCard } from "../cards/RecommendationCard";
import { ColdStartInsightsCard } from "../cards/ColdStartInsightsCard";
import { QuotesProofDrawer } from "../drawers/QuotesProofDrawer";
import { ApplyRecommendationModal } from "../modals/ApplyRecommendationModal";
import { DismissRecommendationModal } from "../modals/DismissRecommendationModal";
import {
  RecommendationItemDto,
  RecommendationStatus,
  InsightCategory,
  InsightImpact,
} from "@/types/insights";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

const STATUS_FILTER_KEYS: Array<{ id: RecommendationStatus; key: "new" | "implemented" | "dismissed" | "all" }> = [
  { id: "NEW", key: "new" },
  { id: "IMPLEMENTED", key: "implemented" },
  { id: "DISMISSED", key: "dismissed" },
  { id: "ALL", key: "all" },
];

const CATEGORY_OPTION_KEYS: Array<{
  id: InsightCategory | "ALL";
  key: "all" | "service_expansion" | "schedule_optimization" | "pricing_and_packaging" | "knowledge_gap" | "staff_balancing" | "marketing_insight";
}> = [
  { id: "ALL", key: "all" },
  { id: "SERVICE_EXPANSION", key: "service_expansion" },
  { id: "SCHEDULE_OPTIMIZATION", key: "schedule_optimization" },
  { id: "PRICING_AND_PACKAGING", key: "pricing_and_packaging" },
  { id: "KNOWLEDGE_GAP", key: "knowledge_gap" },
  { id: "STAFF_BALANCING", key: "staff_balancing" },
  { id: "MARKETING_INSIGHT", key: "marketing_insight" },
];

const IMPACT_OPTION_KEYS: Array<{
  id: InsightImpact | "ALL";
  key: "all" | "high" | "medium" | "low";
}> = [
  { id: "ALL", key: "all" },
  { id: "HIGH", key: "high" },
  { id: "MEDIUM", key: "medium" },
  { id: "LOW", key: "low" },
];

export function RecommendationsTab() {
  const t = useTranslations("insights");
  const [statusFilter, setStatusFilter] = useState<RecommendationStatus>("NEW");
  const [categoryFilter, setCategoryFilter] = useState<InsightCategory | "ALL">("ALL");
  const [impactFilter, setImpactFilter] = useState<InsightImpact | "ALL">("ALL");

  // Drawer / Modal states
  const [quotesRec, setQuotesRec] = useState<RecommendationItemDto | null>(null);
  const [applyRec, setApplyRec] = useState<RecommendationItemDto | null>(null);
  const [dismissRec, setDismissRec] = useState<RecommendationItemDto | null>(null);

  const {
    recommendations,
    isLoading,
    isMutating,
    applyRecommendation,
    dismissRecommendation,
  } = useBusinessRecommendations(undefined, {
    status: statusFilter,
    category: categoryFilter === "ALL" ? undefined : categoryFilter,
    impact: impactFilter === "ALL" ? undefined : impactFilter,
  });

  return (
    <div className="space-y-4">
      {/* Filters Ribbon */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border/60">
        {/* Status Pills */}
        <div className="flex items-center gap-1 overflow-x-auto themed-scroll">
          {STATUS_FILTER_KEYS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setStatusFilter(f.id)}
              className={cn(
                "px-3 py-1.5 text-xs rounded-lg font-medium transition-colors whitespace-nowrap cursor-pointer select-none",
                statusFilter === f.id
                  ? "bg-primary text-primary-foreground font-semibold shadow-2xs"
                  : "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {t(`rec.status.${f.key}`)}
            </button>
          ))}
        </div>

        {/* Category & Impact Selectors */}
        <div className="flex items-center gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as InsightCategory | "ALL")}
            className="h-8 px-2.5 text-xs rounded-lg border border-border/80 bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
          >
            {CATEGORY_OPTION_KEYS.map((c) => (
              <option key={c.id} value={c.id}>
                {t(`rec.category.${c.key}`)}
              </option>
            ))}
          </select>

          <select
            value={impactFilter}
            onChange={(e) => setImpactFilter(e.target.value as InsightImpact | "ALL")}
            className="h-8 px-2.5 text-xs rounded-lg border border-border/80 bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
          >
            {IMPACT_OPTION_KEYS.map((i) => (
              <option key={i.id} value={i.id}>
                {t(`rec.impact.${i.key}`)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Cards Feed */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-5 rounded-xl border border-border/80 bg-card space-y-3">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-24 rounded-md" />
                <Skeleton className="h-5 w-20 rounded-md" />
              </div>
              <Skeleton className="h-4 w-3/4 rounded-md" />
              <Skeleton className="h-3 w-full rounded-md" />
              <div className="flex items-center gap-3 pt-2">
                <Skeleton className="h-3 w-28 rounded-md" />
                <Skeleton className="h-3 w-28 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      ) : recommendations.length === 0 ? (
        statusFilter === "NEW" && categoryFilter === "ALL" && impactFilter === "ALL" ? (
          <ColdStartInsightsCard />
        ) : (
          <div className="p-12 text-center text-xs text-muted-foreground border border-dashed rounded-xl bg-card">
            {t("rec.no_results_filtered")}
          </div>
        )
      ) : (
        <div className="space-y-3">
          {recommendations.map((rec) => (
            <RecommendationCard
              key={rec.id}
              recommendation={rec}
              onViewQuotes={setQuotesRec}
              onApply={setApplyRec}
              onDismiss={setDismissRec}
            />
          ))}
        </div>
      )}

      {/* Slide-over Quotes Drawer */}
      <QuotesProofDrawer
        isOpen={!!quotesRec}
        onClose={() => setQuotesRec(null)}
        recommendation={quotesRec}
      />

      {/* 1-Click Apply Action Modal */}
      <ApplyRecommendationModal
        isOpen={!!applyRec}
        onClose={() => setApplyRec(null)}
        recommendation={applyRec}
        onConfirmApply={async (id, customizedPayload) => {
          await applyRecommendation(id, { customizedPayload });
        }}
        isApplying={isMutating}
      />

      {/* Structured Feedback Dismissal Modal */}
      <DismissRecommendationModal
        isOpen={!!dismissRec}
        onClose={() => setDismissRec(null)}
        recommendation={dismissRec}
        onConfirmDismiss={async (id, payload) => {
          await dismissRecommendation(id, payload);
        }}
        isDismissing={isMutating}
      />
    </div>
  );
}
