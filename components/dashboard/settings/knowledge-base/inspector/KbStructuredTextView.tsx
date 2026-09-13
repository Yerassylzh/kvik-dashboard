"use client";

import React from "react";
import { useTranslations } from "next-intl";

interface KbStructuredTextViewProps {
  isLoading: boolean;
  extractedText: string;
  structuredEntities: { label: string; value: string }[] | null;
}

export function KbStructuredTextView({
  isLoading,
  extractedText,
  structuredEntities,
}: KbStructuredTextViewProps) {
  const t = useTranslations("dashboard");

  return (
    <div className="space-y-3">
      {/* Structured key-value entities if available */}
      {structuredEntities && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {structuredEntities.map((ent, idx) => (
            <div key={idx} className="p-2.5 rounded-xl bg-card border border-border/50 text-xs">
              <span className="text-[10px] text-muted-foreground uppercase font-semibold block">
                {ent.label}
              </span>
              <span className="font-semibold text-foreground mt-0.5 block truncate">
                {ent.value}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Main Readable Text Content */}
      <div className="relative rounded-2xl bg-card border border-border/60 p-4 max-h-80 overflow-y-auto space-y-2 select-text shadow-inner">
        {isLoading ? (
          <div className="py-12 text-center text-xs text-muted-foreground">
            {t("knowledge.loading_data")}
          </div>
        ) : extractedText ? (
          <div className="text-xs leading-relaxed text-foreground whitespace-pre-wrap font-sans space-y-2">
            {extractedText}
          </div>
        ) : (
          <div className="py-12 text-center text-xs text-muted-foreground italic">
            {t("knowledge.no_text_content")}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-[11px] text-muted-foreground px-1">
        <span>{t("knowledge.symbols_count")} {extractedText.length}</span>
        <span>{t("knowledge.used_for_rag")}</span>
      </div>
    </div>
  );
}
