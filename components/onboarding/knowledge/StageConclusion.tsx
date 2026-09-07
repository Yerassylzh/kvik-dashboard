"use client";

import React, { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { BusinessContext, KnowledgeEntry, ParsingStatus } from "@/types/niche";
import { getBusinessContext } from "@/lib/api/onboarding";
import { KnowledgeEntryCard } from "./KnowledgeEntryCard";
import { AiProcessingTimeline } from "@/components/ui/motion/AiProcessingTimeline";
import { FadeIn } from "@/components/ui/motion/FadeIn";
import { InteractiveCard } from "@/components/ui/motion/InteractiveCard";

interface SourceSummary {
  twoGisUrl?: string;
  twoGisStatus?: "IDLE" | "STARTED" | "SKIPPED";
  websiteUrl?: string;
  websiteStatus?: "IDLE" | "STARTED" | "SKIPPED";
  uploadedFilesCount: number;
  savedNotesCount: number;
}

interface StageConclusionProps {
  sources: SourceSummary;
  parsingStatus: ParsingStatus;
  entries: KnowledgeEntry[];
  onConfirm: () => void;
  onGoToStage: (stage: number) => void;
  loading: boolean;
}

const ITEMS_PER_PAGE = 6;

const TYPE_FILTER_KEYS: Record<string, string> = {
  ALL: "knowledge.preview.filter_all",
  LOCAL_LISTING: "knowledge.preview.twogis_catalog_label",
  WEBSITE_CONTENT: "knowledge.preview.website_label",
  DOCUMENT: "knowledge.preview.document_label",
  MANUAL_NOTE: "knowledge.preview.note_label",
};

export function StageConclusion({
  sources,
  parsingStatus,
  entries,
  onConfirm,
  onGoToStage,
  loading,
}: StageConclusionProps) {
  const t = useTranslations("onboarding");
  const [page, setPage] = useState(1);
  const [filterType, setFilterType] = useState<string>("ALL");
  const [context, setContext] = useState<BusinessContext | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getBusinessContext();
        if (
          !cancelled &&
          res &&
          (res.businessType || res.servicesOffered?.length)
        ) {
          setContext(res);
        }
      } catch {
        // Business context optional
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const isParsing =
    (parsingStatus === "QUEUED" || parsingStatus === "PROCESSING") &&
    entries.length === 0;

  const isBackgroundBusy =
    parsingStatus === "QUEUED" ||
    parsingStatus === "PROCESSING" ||
    sources.twoGisStatus === "STARTED" ||
    sources.websiteStatus === "STARTED" ||
    entries.some(
      (e) =>
        e.processingStatus === "PENDING" || e.processingStatus === "PROCESSING"
    );

  const filteredEntries =
    filterType === "ALL"
      ? entries
      : entries.filter((e) => e.type === filterType);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredEntries.length / ITEMS_PER_PAGE),
  );
  const safePage = Math.min(Math.max(1, page), totalPages);
  const visible = filteredEntries.slice(
    (safePage - 1) * ITEMS_PER_PAGE,
    safePage * ITEMS_PER_PAGE,
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <FadeIn delay={0.05} className="space-y-1 text-center sm:text-left">
        <div className="flex items-center justify-center sm:justify-start gap-2">
          <span className="text-2xl">🎯</span>
          <h2 className="text-lg sm:text-xl font-bold text-foreground">
            {t("knowledge.preview.title")}
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          {t("knowledge.preview.subtitle")}
        </p>
      </FadeIn>

      {/* Background Processing Banner */}
      {isBackgroundBusy && entries.length > 0 && (
        <FadeIn delay={0.08} className="p-3.5 rounded-2xl bg-primary/10 border border-primary/20 flex items-center gap-3 text-xs text-foreground shadow-xs">
          <div className="h-4 w-4 border-2 border-accent-brand/40 border-t-accent-brand rounded-full animate-spin flex-shrink-0" />
          <span>{t("knowledge.preview.bg_processing_banner")}</span>
        </FadeIn>
      )}

      {/* Sources Overview Grid */}
      <FadeIn delay={0.1} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* 2GIS Card */}
        <InteractiveCard
          onClick={() => onGoToStage(0)}
          className="p-3.5 rounded-2xl bg-card border border-border flex flex-col justify-between shadow-xs"
        >
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-lg">📍</span>
              {sources.twoGisStatus === "STARTED" ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                  {t("knowledge.preview.status_connected")}
                </span>
              ) : (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                  {t("knowledge.preview.status_skipped")}
                </span>
              )}
            </div>
            <p className="font-bold text-xs text-foreground">2GIS</p>
            <p className="text-[11px] text-muted-foreground truncate mt-0.5">
              {sources.twoGisUrl || t("knowledge.preview.not_added")}
            </p>
          </div>
          <span className="text-[11px] text-accent-brand font-semibold hover:underline mt-2 inline-block">
            {t("knowledge.preview.btn_change")}
          </span>
        </InteractiveCard>

        {/* Website Card */}
        <InteractiveCard
          onClick={() => onGoToStage(1)}
          className="p-3.5 rounded-2xl bg-card border border-border flex flex-col justify-between shadow-xs"
        >
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-lg">🌐</span>
              {sources.websiteStatus === "STARTED" ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                  {t("knowledge.preview.status_connected")}
                </span>
              ) : (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                  {t("knowledge.preview.status_skipped")}
                </span>
              )}
            </div>
            <p className="font-bold text-xs text-foreground">
              {t("knowledge.preview.website_label")}
            </p>
            <p className="text-[11px] text-muted-foreground truncate mt-0.5">
              {sources.websiteUrl || t("knowledge.preview.not_added")}
            </p>
          </div>
          <span className="text-[11px] text-accent-brand font-semibold hover:underline mt-2 inline-block">
            {t("knowledge.preview.btn_change")}
          </span>
        </InteractiveCard>

        {/* Documents Card */}
        <InteractiveCard
          onClick={() => onGoToStage(2)}
          className="p-3.5 rounded-2xl bg-card border border-border flex flex-col justify-between shadow-xs"
        >
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-lg">📄</span>
              {sources.uploadedFilesCount > 0 ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                  {t("knowledge.preview.files_count", {
                    count: sources.uploadedFilesCount,
                  })}
                </span>
              ) : (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                  {t("knowledge.preview.files_count", { count: 0 })}
                </span>
              )}
            </div>
            <p className="font-bold text-xs text-foreground">
              {t("knowledge.preview.document_label")}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {sources.uploadedFilesCount > 0
                ? t("knowledge.preview.files_uploaded")
                : t("knowledge.preview.no_files")}
            </p>
          </div>
          <span className="text-[11px] text-accent-brand font-semibold hover:underline mt-2 inline-block">
            {t("knowledge.preview.btn_add")}
          </span>
        </InteractiveCard>

        {/* Notes Card */}
        <InteractiveCard
          onClick={() => onGoToStage(3)}
          className="p-3.5 rounded-2xl bg-card border border-border flex flex-col justify-between shadow-xs"
        >
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-lg">📝</span>
              {sources.savedNotesCount > 0 ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                  {t("knowledge.preview.notes_count", {
                    count: sources.savedNotesCount,
                  })}
                </span>
              ) : (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                  {t("knowledge.preview.notes_count", { count: 0 })}
                </span>
              )}
            </div>
            <p className="font-bold text-xs text-foreground">
              {t("knowledge.preview.note_label")}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {sources.savedNotesCount > 0
                ? t("knowledge.preview.notes_saved")
                : t("knowledge.preview.no_notes")}
            </p>
          </div>
          <span className="text-[11px] text-accent-brand font-semibold hover:underline mt-2 inline-block">
            {t("knowledge.preview.btn_add")}
          </span>
        </InteractiveCard>
      </FadeIn>

      {/* Dynamic Animated AI Processing Timeline */}
      {isParsing && (
        <FadeIn delay={0.15}>
          <AiProcessingTimeline
            stages={[
              { id: "read", label: "Чтение и анализ источников" },
              { id: "extract", label: "Извлечение прайс-листа и услуг" },
              { id: "structure", label: "Структурирование базы знаний" },
            ]}
            currentStageIndex={1}
            status="PROCESSING"
            title={t("knowledge.preview.loading_title")}
            subtitle={t("knowledge.preview.loading_desc")}
          />
        </FadeIn>
      )}

      {/* AI Business Context Summary */}
      {context && !isParsing && (
        <FadeIn
          delay={0.15}
          className="p-4 rounded-2xl bg-primary/5 border border-primary/20 space-y-2.5 shadow-xs"
        >
          <p className="font-bold text-foreground text-xs flex items-center gap-1.5">
            <span>🤖</span>
            <span>{t("knowledge.preview.ai_summary_title")}:</span>
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {context.businessType && (
              <div>
                <span className="font-semibold text-foreground">
                  {t("knowledge.preview.context_type")}:{" "}
                </span>
                <span className="text-muted-foreground">
                  {context.businessType}
                </span>
              </div>
            )}
            {context.pricingPolicy && (
              <div>
                <span className="font-semibold text-foreground">
                  {t("knowledge.preview.context_pricing")}:{" "}
                </span>
                <span className="text-muted-foreground">
                  {context.pricingPolicy}
                </span>
              </div>
            )}
            {context.bookingPolicy && (
              <div className="sm:col-span-2">
                <span className="font-semibold text-foreground">
                  {t("knowledge.preview.context_booking")}:{" "}
                </span>
                <span className="text-muted-foreground">
                  {context.bookingPolicy}
                </span>
              </div>
            )}
          </div>
        </FadeIn>
      )}

      {/* Structured Knowledge Entries Preview */}
      {!isParsing && (
        <FadeIn delay={0.2} className="space-y-3">
          {entries.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden p-1 rounded-xl bg-muted/40 border border-border/70 w-full sm:w-fit">
              {[
                "ALL",
                "LOCAL_LISTING",
                "WEBSITE_CONTENT",
                "DOCUMENT",
                "MANUAL_NOTE",
              ].map((k) => {
                const count =
                  k === "ALL"
                    ? entries.length
                    : entries.filter((e) => e.type === k).length;
                if (count === 0 && k !== "ALL") return null;

                const labelKey = TYPE_FILTER_KEYS[k];
                const label = labelKey ? t(labelKey as any) : k;
                const isActive = filterType === k;
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => {
                      setFilterType(k);
                      setPage(1);
                    }}
                    className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1.5 flex-shrink-0 select-none ${
                      isActive
                        ? "bg-card text-foreground font-semibold shadow-xs border border-border"
                        : "text-muted-foreground hover:text-foreground hover:bg-card/40"
                    }`}
                  >
                    <span>{label}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Entries List */}
          <div className="themed-scroll space-y-3 max-h-[26rem] overflow-y-auto pr-1">
            {visible.length > 0 ? (
              visible.map((entry) => (
                <KnowledgeEntryCard key={entry.id} entry={entry} />
              ))
            ) : (
              <div className="py-8 text-center text-muted-foreground text-xs bg-muted/20 rounded-2xl border border-dashed border-border">
                {t("knowledge.preview.entries_empty")}
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-1.5 pt-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                <button
                  key={pg}
                  onClick={() => setPage(pg)}
                  className={`h-7 w-7 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                    pg === safePage
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "bg-muted hover:bg-muted/80 text-muted-foreground"
                  }`}
                >
                  {pg}
                </button>
              ))}
            </div>
          )}
        </FadeIn>
      )}

      {/* Action Footer */}
      <FadeIn delay={0.25} className="pt-2 flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={() => onGoToStage(0)}
          className="py-3 px-4 rounded-xl border border-border hover:bg-muted text-xs font-semibold text-foreground transition-colors cursor-pointer"
        >
          {t("knowledge.preview.btn_add_more")}
        </button>

        <button
          type="button"
          onClick={onConfirm}
          disabled={loading || isParsing}
          className="flex-1 py-3.5 px-6 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs sm:text-sm rounded-xl shadow-lg transition-all disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              {t("knowledge.preview.saving_btn")}
            </>
          ) : (
            t("knowledge.preview.btn_confirm")
          )}
        </button>
      </FadeIn>
    </div>
  );
}
