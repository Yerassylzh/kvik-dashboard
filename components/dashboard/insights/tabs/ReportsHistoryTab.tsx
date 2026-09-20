"use client";

import React, { useState } from "react";
import { useWeeklyReports } from "@/hooks/useBusinessInsights";
import { WeeklyReportDetailModal } from "../modals/WeeklyReportDetailModal";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";

export function ReportsHistoryTab() {
  const t = useTranslations("insights");
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const { reports, total, isLoading } = useWeeklyReports(undefined, { page: 1, limit: 20 });

  return (
    <div className="space-y-3">
      {/* Minimal header strip */}
      <div className="flex items-center justify-between text-xs text-muted-foreground pb-2 border-b border-border/50">
        <span>{t("reports.weekly_snapshots")}</span>
        {!isLoading && (
          <span className="font-mono font-medium tabular-nums">
            {t("reports.count", { count: total })}
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 rounded-xl border border-border/70 bg-card space-y-2">
              <Skeleton className="h-4 w-48 rounded-md" />
              <Skeleton className="h-3 w-72 rounded-md" />
            </div>
          ))}
        </div>
      ) : reports.length === 0 ? (
        <div className="p-12 text-center text-xs text-muted-foreground border border-dashed rounded-xl bg-card">
          {t("reports.empty")}
        </div>
      ) : (
        <div className="space-y-2">
          {reports.map((report) => (
            <div
              key={report.id}
              className="p-4 rounded-xl border border-border/70 bg-card hover:border-border transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded-md bg-primary/10 text-primary">
                    <FileText className="w-3.5 h-3.5" />
                  </span>
                  <h3 className="text-sm font-semibold text-foreground">{report.weekLabel}</h3>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-muted-foreground font-mono">
                  <span>{report.totalLeadsAnalyzed} {t("reports.dialogs")}</span>
                  <span>·</span>
                  <span className={report.totalLostLeads > 0 ? "text-rose-600" : ""}>
                    {report.totalLostLeads} {t("reports.lost")}
                  </span>
                  <span>·</span>
                  <span className="text-primary font-semibold">
                    {report.totalInsightsFound} {t("reports.insights_found")}
                  </span>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="text-xs gap-1.5 h-7 font-medium self-start sm:self-auto"
                onClick={() => setSelectedReportId(report.id)}
              >
                <span>{t("reports.open_btn")}</span>
                <ArrowRight className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <WeeklyReportDetailModal
        isOpen={!!selectedReportId}
        onClose={() => setSelectedReportId(null)}
        reportId={selectedReportId}
      />
    </div>
  );
}
