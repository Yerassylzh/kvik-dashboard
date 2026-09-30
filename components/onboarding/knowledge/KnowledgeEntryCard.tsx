"use client";

import React, { useState } from "react";
import {
  MapPin,
  Globe,
  FileText,
  StickyNote,
  Layers,
  AlertCircle,
  Tag,
  Phone,
  Clock,
  ExternalLink,
} from "lucide-react";
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
    icon: React.ElementType;
    translationKey: string;
    badgeStyle: string;
  }
> = {
  LOCAL_LISTING: {
    icon: MapPin,
    translationKey: "knowledge.preview.twogis_catalog_label",
    badgeStyle: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  },
  WEBSITE_CONTENT: {
    icon: Globe,
    translationKey: "knowledge.preview.website_label",
    badgeStyle: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
  },
  DOCUMENT: {
    icon: FileText,
    translationKey: "knowledge.preview.document_label",
    badgeStyle: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20",
  },
  MANUAL_NOTE: {
    icon: StickyNote,
    translationKey: "knowledge.preview.note_label",
    badgeStyle: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
  },
};

export function KnowledgeEntryCard({ entry }: KnowledgeEntryCardProps) {
  const t = useTranslations("onboarding");
  const [expanded, setExpanded] = useState(false);

  const typeConfig = TYPE_META[entry.type] || {
    icon: Layers,
    translationKey: "knowledge.preview.note_label",
    badgeStyle: "bg-muted text-muted-foreground border-border",
  };
  const IconComponent = typeConfig.icon;

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
          <div className="h-9 w-9 rounded-xl bg-muted/60 border border-border flex items-center justify-center flex-shrink-0 text-foreground">
            <IconComponent className="w-4 h-4 text-muted-foreground" />
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
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20 flex items-center gap-1.5 flex-shrink-0">
                  <div className="h-2 w-2 border-2 border-primary/40 border-t-primary rounded-full animate-spin" />
                  <span>{t("knowledge.preview.status_processing")}</span>
                </span>
              )}

              {isFailed && (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-destructive/10 text-destructive border border-destructive/20 flex items-center gap-1 flex-shrink-0">
                  <AlertCircle className="w-3 h-3 text-destructive" />
                  <span>{t("knowledge.preview.status_failed")}</span>
                </span>
              )}
            </div>

            {/* Metadata Tags */}
            <div className="flex items-center gap-2 flex-wrap mt-1.5 text-xs text-muted-foreground">
              {category && (
                <span className="inline-flex items-center gap-1 bg-muted/60 px-2 py-0.5 rounded text-foreground font-medium text-[11px]">
                  <Tag className="w-3 h-3 text-muted-foreground" /> {category}
                </span>
              )}
              {address && (
                <span className="inline-flex items-center gap-1 text-[11px]">
                  <MapPin className="w-3 h-3 text-muted-foreground" /> {address}
                </span>
              )}
              {phone && (
                <span className="inline-flex items-center gap-1 text-[11px]">
                  <Phone className="w-3 h-3 text-muted-foreground" /> {phone}
                </span>
              )}
              {schedule && (
                <span className="inline-flex items-center gap-1 text-[11px]">
                  <Clock className="w-3 h-3 text-muted-foreground" /> {schedule}
                </span>
              )}
              {price && (
                <span className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400 text-[11px]">
                  {price}
                </span>
              )}
              {entry.fileSize && (
                <span className="inline-flex items-center gap-1 text-[11px] bg-muted/60 px-2 py-0.5 rounded text-muted-foreground">
                  {formatBytes(entry.fileSize)}
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
            className="text-xs text-primary hover:underline flex-shrink-0 hidden sm:inline-flex items-center gap-1 font-medium pt-0.5"
          >
            <span>{t("knowledge.preview.source_link")}</span>
            <ExternalLink className="w-3 h-3" />
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
                className="text-primary hover:underline cursor-pointer text-xs font-medium"
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {servicesList.slice(0, 8).map((srv, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-xl bg-muted/40 border border-border/50 flex items-center justify-between gap-2 text-xs"
              >
                <span className="text-foreground font-medium truncate">
                  {srv.name}
                </span>
                {srv.price && (
                  <span className="font-bold text-foreground font-mono text-[11px] flex-shrink-0">
                    {srv.price}
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
