"use client";

import React, { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { BusinessContext, KnowledgeEntry, ParsingStatus } from "@/types/niche";
import { getBusinessContext, getKnowledgeEntries } from "@/lib/api/onboarding";
import { KnowledgeEntryCard } from "./knowledge/KnowledgeEntryCard";
import { BusinessContextSummary } from "./knowledge/BusinessContextSummary";
import { AiProcessingTimeline } from "@/components/ui/motion/AiProcessingTimeline";
import { FadeIn } from "@/components/ui/motion/FadeIn";
import { SegmentedTabs, TabItem } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

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
  loading: boolean;
}

const ITEMS_PER_PAGE = 6;

type FilterType =
  | "ALL"
  | "LOCAL_LISTING"
  | "WEBSITE_CONTENT"
  | "DOCUMENT"
  | "MANUAL_NOTE";

export function StepDataPreview({
  dataPreview,
  onConfirm,
  loading,
}: StepDataPreviewProps) {
  const t = useTranslations("onboarding");
  const { parsingStatus, error } = dataPreview;
  const [entries, setEntries] = useState<KnowledgeEntry[]>(
    dataPreview.entries || []
  );
  const [selectedFilter, setSelectedFilter] = useState<FilterType>("ALL");
  const [page, setPage] = useState(1);
  const [context, setContext] = useState<BusinessContext | null>(null);

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

  const filteredEntries = entries.filter((entry) => {
    if (selectedFilter === "ALL") return true;
    return entry.type === selectedFilter;
  });

  const totalPages = Math.max(
    1,
    Math.ceil(filteredEntries.length / ITEMS_PER_PAGE)
  );
  const safePage = Math.min(Math.max(1, page), totalPages);
  const visible = filteredEntries.slice(
    (safePage - 1) * ITEMS_PER_PAGE,
    safePage * ITEMS_PER_PAGE
  );

  const allFilterTabs: TabItem<FilterType>[] = [
    {
      id: "ALL",
      label: t("knowledge.preview.filter_all"),
      icon: "📦",
      count: entries.length,
    },
    {
      id: "LOCAL_LISTING",
      label: t("knowledge.preview.filter_twogis"),
      icon: "📍",
      count: entries.filter((e) => e.type === "LOCAL_LISTING").length,
    },
    {
      id: "WEBSITE_CONTENT",
      label: t("knowledge.preview.filter_website"),
      icon: "🌐",
      count: entries.filter((e) => e.type === "WEBSITE_CONTENT").length,
    },
    {
      id: "DOCUMENT",
      label: t("knowledge.preview.filter_documents"),
      icon: "📄",
      count: entries.filter((e) => e.type === "DOCUMENT").length,
    },
    {
      id: "MANUAL_NOTE",
      label: t("knowledge.preview.filter_notes"),
      icon: "📝",
      count: entries.filter((e) => e.type === "MANUAL_NOTE").length,
    },
  ];

  const filterTabs = allFilterTabs.filter(
    (tab) => tab.id === "ALL" || (tab.count ?? 0) > 0
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
      {/* Background Processing Notice */}
      {isBackgroundBusy && entries.length > 0 && (
        <FadeIn
          delay={0.02}
          className="p-3.5 rounded-2xl bg-primary/10 border border-primary/20 flex items-center gap-3 text-xs text-foreground shadow-xs"
        >
          <div className="h-4 w-4 border-2 border-accent-brand/40 border-t-accent-brand rounded-full animate-spin flex-shrink-0" />
          <span>{t("knowledge.preview.bg_processing_banner")}</span>
        </FadeIn>
      )}

      {/* AI Business Context Summary Card */}
      {context && <BusinessContextSummary context={context} />}

      {/* Source Filter Tabs & Entries List */}
      <FadeIn delay={0.1} className="space-y-3">
        {entries.length > 0 && (
          <SegmentedTabs
            tabs={filterTabs}
            activeTab={selectedFilter}
            onChange={(id) => {
              setSelectedFilter(id);
              setPage(1);
            }}
          />
        )}

        {/* Entries List */}
        <div className="themed-scroll space-y-3 max-h-[30rem] overflow-y-auto pr-1">
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

      {/* Prominent Action Button */}
      <FadeIn delay={0.15} className="pt-2">
        <Button
          type="button"
          onClick={onConfirm}
          loading={loading}
          size="lg"
          className="w-full shadow-lg"
        >
          {loading
            ? t("knowledge.preview.saving_btn")
            : t("knowledge.preview.btn_confirm")}
        </Button>
      </FadeIn>
    </div>
  );
}
