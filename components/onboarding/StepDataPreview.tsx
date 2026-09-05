"use client";

import React, { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { BusinessContext, KnowledgeEntry, ParsingStatus } from "@/types/niche";
import { getBusinessContext, getKnowledgeEntries } from "@/lib/api/onboarding";
import { KnowledgeEntryCard } from "./knowledge/KnowledgeEntryCard";
import { AiProcessingTimeline } from "@/components/ui/motion/AiProcessingTimeline";
import { FadeIn } from "@/components/ui/motion/FadeIn";

export interface KnowledgePreviewState {
  parsingStatus: ParsingStatus;
  parsedCount: number;
  totalCount: number;
  failedCount: number;
  error?: string;
  entries: KnowledgeEntry[];
}

interface StepDataPreviewProps {
  dataPreview: KnowledgePreviewState;
  onConfirm: () => void;
  onBack?: () => void;
  loading: boolean;
}

const ITEMS_PER_PAGE = 6;

type FilterType =
  | "ALL"
  | "LOCAL_LISTING"
  | "WEBSITE_CONTENT"
  | "DOCUMENT"
  | "MANUAL_NOTE";

const FILTER_TABS: Array<{ id: FilterType; labelKey: string; icon: string }> = [
  { id: "ALL", labelKey: "knowledge.preview.filter_all", icon: "📦" },
  {
    id: "LOCAL_LISTING",
    labelKey: "knowledge.preview.filter_twogis",
    icon: "📍",
  },
  {
    id: "WEBSITE_CONTENT",
    labelKey: "knowledge.preview.filter_website",
    icon: "🌐",
  },
  {
    id: "DOCUMENT",
    labelKey: "knowledge.preview.filter_documents",
    icon: "📄",
  },
  { id: "MANUAL_NOTE", labelKey: "knowledge.preview.filter_notes", icon: "📝" },
];

function ContextRow({
  label,
  value,
}: {
  label: string;
  value?: string | string[] | null;
}) {
  if (!value) return null;
  const text = Array.isArray(value) ? value.join("; ") : value;
  if (!text.trim()) return null;
  return (
    <div className="flex gap-2 text-xs">
      <span className="font-semibold text-foreground flex-shrink-0">
        {label}:
      </span>
      <span className="text-muted-foreground">{text}</span>
    </div>
  );
}

export function StepDataPreview({
  dataPreview,
  onConfirm,
  onBack,
  loading,
}: StepDataPreviewProps) {
  const t = useTranslations("onboarding");
  const { parsingStatus, error } = dataPreview;
  const [entries, setEntries] = useState<KnowledgeEntry[]>(
    dataPreview.entries || [],
  );
  const [selectedFilter, setSelectedFilter] = useState<FilterType>("ALL");
  const [page, setPage] = useState(1);
  const [context, setContext] = useState<BusinessContext | null>(null);

  // Fetch Business Context and Knowledge Entries on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [contextRes, entriesRes] = await Promise.allSettled([
          getBusinessContext(),
          getKnowledgeEntries(),
        ]);

        if (!cancelled) {
          if (contextRes.status === "fulfilled" && contextRes.value) {
            setContext(contextRes.value);
          }
          if (
            entriesRes.status === "fulfilled" &&
            entriesRes.value?.entries?.length
          ) {
            setEntries(entriesRes.value.entries);
          } else if (dataPreview.entries?.length) {
            setEntries(dataPreview.entries);
          }
        }
      } catch {
        // Silent catch
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [dataPreview.entries]);

  useEffect(() => {
    if (dataPreview.entries && dataPreview.entries.length > 0) {
      setEntries(dataPreview.entries);
    }
  }, [dataPreview.entries]);

  const isParsing =
    (parsingStatus === "QUEUED" || parsingStatus === "PROCESSING") &&
    entries.length === 0;
  const isFailed = parsingStatus === "FAILED" && entries.length === 0;
  const isBackgroundBusy =
    parsingStatus === "QUEUED" ||
    parsingStatus === "PROCESSING" ||
    entries.some(
      (e) =>
        e.processingStatus === "PENDING" || e.processingStatus === "PROCESSING"
    );

  // Filter entries
  const filteredEntries = entries.filter((entry) => {
    if (selectedFilter === "ALL") return true;
    return entry.type === selectedFilter;
  });

  const totalPages = Math.max(
    1,
    Math.ceil(filteredEntries.length / ITEMS_PER_PAGE),
  );
  const safePage = Math.min(Math.max(1, page), totalPages);
  const visible = filteredEntries.slice(
    (safePage - 1) * ITEMS_PER_PAGE,
    safePage * ITEMS_PER_PAGE,
  );

  if (isFailed) {
    return (
      <FadeIn className="space-y-6">
        <div className="p-6 rounded-2xl alert-destructive border text-center shadow-xs">
          <div className="text-3xl mb-2">⚠️</div>
          <p className="font-bold text-sm">
            {t("knowledge.preview.error_failed_title")}
          </p>
          <p className="text-xs mt-1.5 opacity-90">
            {error || t("knowledge.preview.error_failed_desc")}
          </p>
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="mt-4 px-4 py-2 bg-background border border-border text-foreground text-xs font-semibold rounded-xl hover:bg-muted cursor-pointer"
            >
              {t("knowledge.preview.btn_back_to_sources")}
            </button>
          )}
        </div>
      </FadeIn>
    );
  }

  if (isParsing) {
    return (
      <FadeIn>
        <AiProcessingTimeline
          stages={[
            { id: "read", label: "Чтение и анализ подключенных источников" },
            { id: "extract", label: "Распознавание прайс-листа и услуг ИИ" },
            {
              id: "structure",
              label: "Формирование структурированного каталога",
            },
          ]}
          currentStageIndex={1}
          status="PROCESSING"
          title={t("knowledge.preview.loading_title")}
          subtitle={t("knowledge.preview.loading_desc")}
        />
      </FadeIn>
    );
  }

  return (
    <div className="space-y-6">
      {/* Background Processing Banner */}
      {isBackgroundBusy && entries.length > 0 && (
        <FadeIn delay={0.02} className="p-3.5 rounded-2xl bg-primary/10 border border-primary/20 flex items-center gap-3 text-xs text-foreground shadow-xs">
          <div className="h-4 w-4 border-2 border-accent-brand/40 border-t-accent-brand rounded-full animate-spin flex-shrink-0" />
          <span>{t("knowledge.preview.bg_processing_banner")}</span>
        </FadeIn>
      )}

      {/* AI Business Context Summary Card */}
      {context && (
        <FadeIn
          delay={0.05}
          className="p-4 sm:p-5 rounded-2xl bg-primary/5 border border-primary/20 space-y-2.5 shadow-xs"
        >
          <p className="font-bold text-foreground text-xs sm:text-sm flex items-center gap-2">
            <span>🤖</span>
            <span>{t("knowledge.preview.ai_summary_title")}</span>
          </p>
          <div className="space-y-1.5 pt-1">
            <ContextRow
              label={t("knowledge.preview.context_type")}
              value={context.businessType}
            />
            <ContextRow
              label={t("knowledge.preview.context_specialization")}
              value={context.specialization}
            />
            <ContextRow
              label={t("knowledge.preview.context_services")}
              value={context.servicesOffered}
            />
            <ContextRow
              label={t("knowledge.preview.context_pricing")}
              value={context.pricingPolicy}
            />
            <ContextRow
              label={t("knowledge.preview.context_booking")}
              value={context.bookingPolicy}
            />
            <ContextRow
              label={t("knowledge.preview.context_team")}
              value={context.teamSummary}
            />
            <ContextRow
              label={t("knowledge.preview.context_schedule")}
              value={context.workingHours}
            />
          </div>
        </FadeIn>
      )}

      {/* Source Filter Tabs & Entries List */}
      <FadeIn delay={0.1} className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
            {t("knowledge.preview.entries_title", {
              count: filteredEntries.length,
            })}
          </h3>

          {/* Source Tabs Filter */}
          {entries.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {FILTER_TABS.map((tab) => {
                const count =
                  tab.id === "ALL"
                    ? entries.length
                    : entries.filter((e) => e.type === tab.id).length;
                if (count === 0 && tab.id !== "ALL") return null;

                const isActive = selectedFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setSelectedFilter(tab.id);
                      setPage(1);
                    }}
                    className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1 flex-shrink-0 ${
                      isActive
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    <span>{tab.icon}</span>
                    <span>{t(tab.labelKey as any)}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full ${isActive ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Entries Grid */}
        <div className="themed-scroll space-y-3 max-h-[28rem] overflow-y-auto pr-1">
          {visible.length > 0 ? (
            visible.map((entry) => (
              <KnowledgeEntryCard key={entry.id} entry={entry} />
            ))
          ) : (
            <div className="py-12 text-center text-muted-foreground text-xs bg-muted/20 rounded-2xl border border-dashed border-border">
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
                type="button"
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

      {/* Action Buttons: Back to sources & Confirm */}
      <FadeIn
        delay={0.15}
        className="pt-2 flex flex-col sm:flex-row items-center gap-3"
      >
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            disabled={loading}
            className="w-full sm:w-auto py-3.5 px-5 bg-muted hover:bg-muted/80 text-foreground border border-border font-semibold text-xs sm:text-sm rounded-xl transition-all cursor-pointer disabled:opacity-50"
          >
            {t("knowledge.preview.btn_back_to_sources")}
          </button>
        )}

        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className="w-full sm:flex-1 py-4 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs sm:text-sm rounded-xl shadow-lg transition-all disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              <span>{t("knowledge.preview.saving_btn")}</span>
            </>
          ) : (
            <span>{t("knowledge.preview.btn_confirm")}</span>
          )}
        </button>
      </FadeIn>
    </div>
  );
}
