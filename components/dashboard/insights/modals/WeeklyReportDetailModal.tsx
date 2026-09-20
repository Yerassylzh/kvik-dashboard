"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useWeeklyReportDetail } from "@/hooks/useBusinessInsights";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, FileText } from "lucide-react";
import { useTranslations } from "next-intl";
import { StructuredMarkdownView } from "@/components/onboarding/knowledge/StructuredMarkdownView";

interface WeeklyReportDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportId: string | null;
}

export function WeeklyReportDetailModal({
  isOpen,
  onClose,
  reportId,
}: WeeklyReportDetailModalProps) {
  const t = useTranslations("insights");
  const { report, isLoading } = useWeeklyReportDetail(undefined, reportId);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto themed-scroll">
        <DialogHeader className="text-left space-y-1 pb-3 border-b border-border/70">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-md bg-primary/10 text-primary">
              <FileText className="w-4 h-4" />
            </span>
            <DialogTitle className="text-base font-bold">
              {report?.weekLabel || t("report_detail.fallback_title")}
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            <span>{t("report_detail.immutable_notice")}</span>
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4 py-4">
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-40 w-full rounded-xl" />
          </div>
        ) : !report ? (
          <div className="py-8 text-center text-xs text-muted-foreground">
            {t("report_detail.not_found")}
          </div>
        ) : (
          <div className="space-y-4 py-2">
            {/* KPI Summary Pill */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
              <div className="p-2.5 rounded-lg bg-muted/40 border border-border/60">
                <span className="text-[11px] text-muted-foreground block">{t("report_detail.dialogs_label")}</span>
                <span className="text-base font-bold text-foreground font-mono tabular-nums">
                  {report.totalLeadsAnalyzed}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-muted/40 border border-border/60">
                <span className="text-[11px] text-muted-foreground block">{t("report_detail.lost_label")}</span>
                <span className="text-base font-bold text-rose-600 font-mono tabular-nums">
                  {report.totalLostLeads}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-muted/40 border border-border/60">
                <span className="text-[11px] text-muted-foreground block">{t("report_detail.insights_label")}</span>
                <span className="text-base font-bold text-primary font-mono tabular-nums">
                  {report.totalInsightsFound}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-muted/40 border border-border/60">
                <span className="text-[11px] text-muted-foreground block">{t("report_detail.high_impact_label")}</span>
                <span className="text-base font-bold text-foreground font-mono tabular-nums">
                  {report.highImpactCount}
                </span>
              </div>
            </div>

            {/* Rendered Markdown Briefing */}
            <div className="p-4 rounded-xl border border-border/80 bg-card space-y-3">
              <h4 className="text-xs font-bold text-foreground uppercase tracking-wider text-muted-foreground">
                {t("report_detail.ai_briefing_title")}
              </h4>
              <div className="text-xs text-foreground/90 leading-relaxed font-sans">
                <StructuredMarkdownView content={report.markdownContent || ""} />
              </div>
            </div>

            {/* Recommendations linked to report */}
            {report.recommendations && report.recommendations.length > 0 && (
              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-bold text-foreground">
                  {t("report_detail.recs_title", { count: report.recommendations.length })}
                </h4>
                <div className="space-y-2">
                  {report.recommendations.map((rec) => (
                    <div
                      key={rec.id}
                      className="p-3 rounded-lg border border-border/70 bg-muted/20 flex items-center justify-between text-xs gap-2"
                    >
                      <div className="space-y-0.5">
                        <p className="font-semibold text-foreground">{rec.title}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {t("report_detail.clients_count", { count: rec.uniqueClientsCount })}
                        </p>
                      </div>
                      <Badge
                        variant={
                          rec.status === "IMPLEMENTED"
                            ? "success"
                            : rec.status === "DISMISSED"
                            ? "secondary"
                            : "primary"
                        }
                        className="text-[10px] shrink-0"
                      >
                        {rec.status === "IMPLEMENTED"
                          ? t("report_detail.rec_implemented")
                          : rec.status === "DISMISSED"
                          ? t("report_detail.rec_dismissed")
                          : t("report_detail.rec_new")}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
