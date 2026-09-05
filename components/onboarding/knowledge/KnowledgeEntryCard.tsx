'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { KnowledgeEntry } from '@/types/niche';
import { StructuredMarkdownView } from './StructuredMarkdownView';

interface KnowledgeEntryCardProps {
  entry: KnowledgeEntry;
}

const TYPE_META: Record<string, { icon: string; translationKey: string; bg: string; text: string }> = {
  LOCAL_LISTING: { icon: '📍', translationKey: 'knowledge.preview.twogis_catalog_label', bg: 'bg-emerald-500/10', text: 'text-emerald-700 dark:text-emerald-400' },
  WEBSITE_CONTENT: { icon: '🌐', translationKey: 'knowledge.preview.website_label', bg: 'bg-blue-500/10', text: 'text-blue-700 dark:text-blue-400' },
  DOCUMENT: { icon: '📄', translationKey: 'knowledge.preview.document_label', bg: 'bg-purple-500/10', text: 'text-purple-700 dark:text-purple-400' },
  MANUAL_NOTE: { icon: '📝', translationKey: 'knowledge.preview.note_label', bg: 'bg-amber-500/10', text: 'text-amber-700 dark:text-amber-400' },
};

function formatBytes(size?: number | null): string {
  if (!size) return '';
  if (size < 1024) return `${size} Б`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} КБ`;
  return `${(size / (1024 * 1024)).toFixed(1)} МБ`;
}

function extractStructuredText(entry: KnowledgeEntry): string | null {
  const d = (entry.data || {}) as Record<string, unknown>;
  const candidates = [
    d.structuredText,
    (entry as unknown as Record<string, unknown>).structuredText,
    d.content,
    d.text,
    d.rawText,
    d.description,
    d.note,
    d.markdown,
    d.summary,
  ];

  for (const val of candidates) {
    if (typeof val === 'string' && val.trim()) return val.trim();
  }
  return null;
}

function extractServicesList(entry: KnowledgeEntry): Array<{ name?: string; price?: string; duration?: string; category?: string }> | null {
  const d = (entry.data || {}) as Record<string, unknown>;
  if (Array.isArray(d.services) && d.services.length > 0) return d.services;
  if (Array.isArray(d.items) && d.items.length > 0) return d.items;
  if (Array.isArray(d.priceList) && d.priceList.length > 0) return d.priceList;
  return null;
}

function cleanEntryTitle(entry: KnowledgeEntry, default2gisLabel: string): string {
  const data = (entry.data || {}) as Record<string, any>;
  const rawTitle = entry.title || data.name || data.title || data.fileName || '';

  // If title is "2GIS Catalog (70000...)" or similar raw technical ID string:
  if (/^2GIS Catalog/i.test(rawTitle) || /^2GIS Каталог/i.test(rawTitle) || !rawTitle) {
    // If real company name exists in data:
    if (data.businessName && typeof data.businessName === 'string' && !/^2GIS/i.test(data.businessName)) {
      return data.businessName;
    }
    if (data.name && typeof data.name === 'string' && !/^2GIS/i.test(data.name)) {
      return data.name;
    }
    return default2gisLabel;
  }

  // Remove trailing numerical IDs in parentheses like "(70000001082563690)"
  return rawTitle.replace(/\s*\(\d{8,}\)$/, '').trim() || default2gisLabel;
}

export function KnowledgeEntryCard({ entry }: KnowledgeEntryCardProps) {
  const t = useTranslations('onboarding');
  const [expanded, setExpanded] = useState(false);

  const typeConfig = TYPE_META[entry.type] || {
    icon: '📦',
    translationKey: 'knowledge.preview.note_label',
    bg: 'bg-muted',
    text: 'text-muted-foreground',
  };

  const typeLabel = t(typeConfig.translationKey as any) || entry.type;
  const default2gisTitle = t('knowledge.preview.twogis_catalog_label');
  const title = cleanEntryTitle(entry, default2gisTitle);

  const data = (entry.data || {}) as Record<string, any>;
  const structuredText = extractStructuredText(entry);
  const servicesList = extractServicesList(entry);

  const address = data.address || data.city || null;
  const phone = data.phone || (Array.isArray(data.phones) ? data.phones.join(', ') : null);
  const schedule = data.schedule || data.workingHours || data.hours || null;
  const category = data.category || (Array.isArray(data.rubrics) ? data.rubrics.join(', ') : data.rubric || null);
  const price = data.price ? String(data.price) : null;

  const isLongText = (structuredText?.length ?? 0) > 350;

  const status = entry.processingStatus || 'COMPLETED';
  const isPending = status === 'PENDING';
  const isProcessing = status === 'PROCESSING';
  const isFailed = status === 'FAILED';
  const isBusy = isPending || isProcessing;

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border hover:border-primary/40 transition-all space-y-4 shadow-sm">
      {/* Header Info */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 text-accent-brand flex items-center justify-center text-xl flex-shrink-0">
            {typeConfig.icon}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-bold text-foreground text-sm sm:text-base tracking-tight">
                {title}
              </h4>
              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${typeConfig.bg} ${typeConfig.text} border-current/20 flex-shrink-0`}>
                {typeLabel}
              </span>

              {/* Dynamic Status Badges for processing items */}
              {isPending && (
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 flex items-center gap-1.5 flex-shrink-0">
                  <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                  <span>{t('knowledge.preview.status_pending')}</span>
                </span>
              )}

              {isProcessing && (
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-primary/10 text-accent-brand border border-primary/20 flex items-center gap-1.5 flex-shrink-0">
                  <div className="h-2 w-2 border-2 border-accent-brand/40 border-t-accent-brand rounded-full animate-spin" />
                  <span>{t('knowledge.preview.status_processing')}</span>
                </span>
              )}

              {isFailed && (
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full alert-destructive border flex items-center gap-1 flex-shrink-0">
                  <span>⚠️</span>
                  <span>{t('knowledge.preview.status_failed')}</span>
                </span>
              )}
            </div>

            {/* Quick Metadata Badges */}
            <div className="flex items-center gap-2 flex-wrap mt-1.5 text-xs text-muted-foreground">
              {category && (
                <span className="inline-flex items-center gap-1 bg-muted px-2.5 py-0.5 rounded-lg text-foreground font-medium">
                  🏷️ {category}
                </span>
              )}
              {address && (
                <span className="inline-flex items-center gap-1">
                  📍 {address}
                </span>
              )}
              {phone && (
                <span className="inline-flex items-center gap-1">
                  📞 {phone}
                </span>
              )}
              {schedule && (
                <span className="inline-flex items-center gap-1">
                  🕒 {schedule}
                </span>
              )}
              {price && (
                <span className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400">
                  💰 {price}
                </span>
              )}
              {entry.fileSize && (
                <span>
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
            className="text-xs text-accent-brand hover:underline flex-shrink-0 hidden sm:inline-flex items-center gap-1 font-medium"
          >
            <span>{t('knowledge.preview.source_link')}</span>
          </a>
        )}
      </div>

      {/* Loading Skeleton / Processing Message if still processing and no text ready */}
      {isBusy && !structuredText && (!servicesList || servicesList.length === 0) && (
        <div className="p-4 rounded-2xl bg-primary/5 border border-primary/15 flex items-center gap-3 animate-pulse">
          <div className="h-4 w-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin flex-shrink-0" />
          <p className="text-xs text-muted-foreground">
            {t('knowledge.preview.processing_entry_desc')}
          </p>
        </div>
      )}

      {/* Scraped / Structured Text Section with Markdown View */}
      {structuredText && (
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span>🤖</span>
              <span>{t('knowledge.preview.title')}:</span>
            </span>
            {isLongText && (
              <button
                type="button"
                onClick={() => setExpanded(!expanded)}
                className="text-accent-brand hover:underline cursor-pointer text-xs font-bold"
              >
                {expanded ? t('knowledge.preview.expand_less') : t('knowledge.preview.expand_more')}
              </button>
            )}
          </div>

          <div
            className={`p-4 rounded-2xl bg-muted/40 border border-border transition-all ${
              !expanded && isLongText ? 'max-h-48 overflow-hidden relative' : ''
            }`}
          >
            <StructuredMarkdownView content={structuredText} />

            {!expanded && isLongText && (
              <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-card/90 to-transparent pointer-events-none" />
            )}
          </div>
        </div>
      )}

      {/* Structured Services & Prices Grid */}
      {servicesList && servicesList.length > 0 && (
        <div className="space-y-2 pt-1">
          <p className="text-xs font-semibold text-muted-foreground">
            {t('knowledge.preview.pricelist_title', { count: servicesList.length })}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto themed-scroll">
            {servicesList.map((svc, i) => (
              <div
                key={i}
                className="p-2.5 rounded-xl bg-muted/50 border border-border text-xs flex items-center justify-between shadow-xs"
              >
                <div className="min-w-0 pr-2">
                  <p className="font-semibold text-foreground truncate">{svc.name || t('knowledge.preview.default_service_name')}</p>
                  {svc.category && <p className="text-[11px] text-muted-foreground">{svc.category}</p>}
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