"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { KnowledgeEntry } from "@/types/niche";
import { StructuredMarkdownView } from "./StructuredMarkdownView";
import {
  formatBytes,
  extractStructuredText,
  extractServicesList,
  cleanEntryTitle,
} from "@/lib/utils/knowledge-parser";

interface KnowledgeEntryCardProps {
  entry: KnowledgeEntry;
}

const TYPE_META: Record<
  string,
  {
    icon: string;
    translationKey: string;
    badgeStyle: string;
  }
> = {
  LOCAL_LISTING: {
    icon: "📍",
    translationKey: "knowledge.preview.twogis_catalog_label",
    badgeStyle: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  },
  WEBSITE_CONTENT: {
    icon: "🌐",
    translationKey: "knowledge.preview.website_label",
    badgeStyle: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
  },
  DOCUMENT: {
    icon: "📄",
    translationKey: "knowledge.preview.document_label",
    badgeStyle: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20",
  },
  MANUAL_NOTE: {
    icon: "📝",
    translationKey: "knowledge.preview.note_label",
    badgeStyle: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
  },
};

export function KnowledgeEntryCard({ entry }: KnowledgeEntryCardProps) {
  const t = useTranslations("onboarding");
  const [expanded, setExpanded] = useState(false);

  const typeConfig = TYPE_META[entry.type] || {
    icon: "📦",
    translationKey: "knowledge.preview.note_label",
    badgeStyle: "bg-muted text-muted-foreground border-border",
  };

  const typeLabel = t(typeConfig.translationKey as any) || entry.type;
  const default2gisTitle = t("knowledge.preview.twogis_catalog_label");
  const defaultNoteTitle = t("knowledge.preview.note_card_title");
  const defaultWebsiteTitle = t("knowledge.preview.website_label");
  const title = cleanEntryTitle(
    entry,
    default2gisTitle,
    defaultNoteTitle,
    defaultWebsiteTitle
  );

  const data = (entry.data || {}) as Record<string, any>;
  const structuredText = extractStructuredText(entry);
  const servicesList = extractServicesList(entry);

  const address = data.address || data.city || null;
  const phone =
    data.phone || (Array.isArray(data.phones) ? data.phones.join(", ") : null);
  const schedule = data.schedule || data.workingHours || data.hours || null;
  const category =
    data.category ||
    (Array.isArray(data.rubrics)
      ? data.rubrics.join(", ")
      : data.rubric || null);
  const price = data.price ? String(data.price) : null;

  const isLongText = (structuredText?.length ?? 0) > 300;

  const status = entry.processingStatus || "COMPLETED";
  const isPending = status === "PENDING";
  const isProcessing = status === "PROCESSING";
  const isFailed = status === "FAILED";
  const isBusy = isPending || isProcessing;

  const isManualNote = entry.type === "MANUAL_NOTE";

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border/80 hover:border-primary/40 transition-all space-y-3.5 shadow-xs">
      {/* Card Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          {/* Type Icon Badge */}
          <div className="h-9 w-9 rounded-xl bg-muted/60 border border-border flex items-center justify-center text-lg flex-shrink-0">
            {typeConfig.icon}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-bold text-foreground text-sm tracking-tight truncate">
                {title}
              </h4>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${typeConfig.badgeStyle} flex-shrink-0`}
              >
                {typeLabel}
              </span>

              {/* Live Status Indicators */}
              {isPending && (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 flex items-center gap-1.5 flex-shrink-0">
                  <div className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                  <span>{t("knowledge.preview.status_pending")}</span>
                </span>
              )}

              {isProcessing && (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-primary/10 text-accent-brand border border-primary/20 flex items-center gap-1.5 flex-shrink-0">
                  <div className="h-2 w-2 border-2 border-accent-brand/40 border-t-accent-brand rounded-full animate-spin" />
                  <span>{t("knowledge.preview.status_processing")}</span>
                </span>
              )}

              {isFailed && (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-destructive/10 text-destructive border border-destructive/20 flex items-center gap-1 flex-shrink-0">
                  <span>⚠️</span>
                  <span>{t("knowledge.preview.status_failed")}</span>
                </span>
              )}
            </div>

            {/* Metadata Tags */}
            <div className="flex items-center gap-2 flex-wrap mt-1 text-xs text-muted-foreground">
              {category && (
                <span className="inline-flex items-center gap-1 bg-muted/60 px-2 py-0.5 rounded text-foreground font-medium text-[11px]">
                  🏷️ {category}
                </span>
              )}
              {address && (
                <span className="inline-flex items-center gap-1 text-[11px]">
                  📍 {address}
                </span>
              )}
              {phone && (
                <span className="inline-flex items-center gap-1 text-[11px]">
                  📞 {phone}
                </span>
              )}
              {schedule && (
                <span className="inline-flex items-center gap-1 text-[11px]">
                  🕒 {schedule}
                </span>
              )}
              {price && (
                <span className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400 text-[11px]">
                  💰 {price}
                </span>
              )}
              {entry.fileSize && (
                <span className="inline-flex items-center gap-1 text-[11px] bg-muted/60 px-2 py-0.5 rounded text-muted-foreground">
                  💾 {formatBytes(entry.fileSize)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Source link */}
        {entry.sourceUrl && (
          <a
            href={entry.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-accent-brand hover:underline flex-shrink-0 hidden sm:inline-flex items-center gap-1 font-medium pt-0.5"
          >
            <span>{t("knowledge.preview.source_link")}</span>
          </a>
        )}
      </div>

      {/* Loading Skeleton if still processing */}
      {isBusy && !structuredText && (!servicesList || servicesList.length === 0) && (
        <div className="p-3 rounded-xl bg-primary/5 border border-primary/15 flex items-center gap-2.5 animate-pulse text-xs text-muted-foreground">
          <div className="h-3.5 w-3.5 border-2 border-primary/30 border-t-primary rounded-full animate-spin flex-shrink-0" />
          <span>{t("knowledge.preview.processing_entry_desc")}</span>
        </div>
      )}

      {/* Manual Note Content */}
      {isManualNote && structuredText && (
        <div className="p-3.5 rounded-xl bg-muted/30 border border-border/60 text-xs text-foreground leading-relaxed whitespace-pre-line">
          {structuredText}
        </div>
      )}

      {/* Non-Note Structured Content with Markdown View */}
      {!isManualNote && structuredText && (
        <div className="space-y-1.5 pt-0.5">
          <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
            <span className="text-[11px] uppercase tracking-wide">
              {t("knowledge.preview.extracted_content")}:
            </span>
            {isLongText && (
              <button
                type="button"
                onClick={() => setExpanded(!expanded)}
                className="text-accent-brand hover:underline cursor-pointer text-xs font-medium"
              >
                {expanded
                  ? t("knowledge.preview.expand_less")
                  : t("knowledge.preview.expand_more")}
              </button>
            )}
          </div>

          <div
            className={`p-3.5 rounded-xl bg-muted/30 border border-border/60 transition-all text-xs ${
              !expanded && isLongText ? "max-h-36 overflow-hidden relative" : ""
            }`}
          >
            <StructuredMarkdownView content={structuredText} />

            {!expanded && isLongText && (
              <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-card to-transparent pointer-events-none" />
            )}
          </div>
        </div>
      )}

      {/* Structured Services & Prices Grid */}
      {servicesList && servicesList.length > 0 && (
        <div className="space-y-1.5 pt-0.5">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
            {t("knowledge.preview.pricelist_title", {
              count: servicesList.length,
            })}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto themed-scroll">
            {servicesList.map((svc, i) => (
              <div
                key={i}
                className="p-2.5 rounded-xl bg-muted/40 border border-border/60 text-xs flex items-center justify-between shadow-2xs"
              >
                <div className="min-w-0 pr-2">
                  <p className="font-semibold text-foreground truncate">
                    {svc.name || t("knowledge.preview.default_service_name")}
                  </p>
                  {svc.category && (
                    <p className="text-[10px] text-muted-foreground">
                      {svc.category}
                    </p>
                  )}
                </div>
                {svc.price && (
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 text-xs flex-shrink-0">
                    {svc.price}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}