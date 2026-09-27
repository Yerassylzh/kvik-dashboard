"use client";

import React, { useState } from "react";
import { ChevronDown, FileText } from "lucide-react";
import { useTranslations } from "next-intl";
import clsx from "clsx";

interface ExtractedTextPreviewProps {
  extractedText: string;
  isUserMessage?: boolean;
}

export function ExtractedTextPreview({
  extractedText,
  isUserMessage = false,
}: ExtractedTextPreviewProps) {
  const t = useTranslations("dashboard");
  const [isOpen, setIsOpen] = useState(false);

  if (!extractedText || !extractedText.trim()) return null;

  return (
    <div className="mt-2 w-full max-w-[320px] sm:max-w-[360px]">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={clsx(
          "flex items-center justify-between w-full px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors cursor-pointer",
          isUserMessage
            ? "bg-white/10 hover:bg-white/15 text-white/90"
            : "bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/50"
        )}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <FileText className="w-3.5 h-3.5 shrink-0 opacity-75" />
          <span className="truncate">
            {isOpen
              ? t("inbox.extracted_text_toggle_hide")
              : t("inbox.extracted_text_toggle_show")}
          </span>
        </div>
        <ChevronDown
          className={clsx(
            "w-3.5 h-3.5 shrink-0 transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {isOpen && (
        <div
          className={clsx(
            "mt-1.5 p-2.5 rounded-lg text-xs font-mono max-h-48 overflow-y-auto themed-scroll whitespace-pre-wrap break-words leading-relaxed border animate-in fade-in duration-150",
            isUserMessage
              ? "bg-black/20 border-white/15 text-white/90"
              : "bg-muted/40 border-border/60 text-foreground"
          )}
        >
          {extractedText}
        </div>
      )}
    </div>
  );
}
