"use client";

import React from "react";
import { FileText, FileSpreadsheet, FileCode, File, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { AttachmentActions } from "./AttachmentActions";
import { ExtractedTextPreview } from "./ExtractedTextPreview";
import clsx from "clsx";

interface DocumentAttachmentProps {
  mediaUrl: string;
  fileName?: string;
  fileSize?: number | null;
  mimeType?: string | null;
  extractedText?: string | null;
  aiProcessed?: boolean;
  isUserMessage?: boolean;
}

export function DocumentAttachment({
  mediaUrl,
  fileName = "document.pdf",
  fileSize,
  extractedText,
  aiProcessed,
  isUserMessage = false,
}: DocumentAttachmentProps) {
  const t = useTranslations("dashboard");

  const formatFileSize = (bytes?: number | null) => {
    if (!bytes) return null;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
  };

  const getFileExtension = (name: string) => {
    const parts = name.split(".");
    return parts.length > 1 ? parts.pop()?.toLowerCase() : "";
  };

  const ext = getFileExtension(fileName);
  const sizeLabel = formatFileSize(fileSize);

  // Icon & color badge based on file extension
  const renderIcon = () => {
    if (ext === "pdf") {
      return (
        <div className="p-2 rounded-lg bg-rose-500/10 text-rose-500 border border-rose-500/20 shrink-0">
          <FileText className="w-5 h-5" />
        </div>
      );
    }
    if (["xlsx", "xls", "csv"].includes(ext || "")) {
      return (
        <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shrink-0">
          <FileSpreadsheet className="w-5 h-5" />
        </div>
      );
    }
    if (["docx", "doc", "rtf"].includes(ext || "")) {
      return (
        <div className="p-2 rounded-lg bg-sky-500/10 text-sky-500 border border-sky-500/20 shrink-0">
          <FileText className="w-5 h-5" />
        </div>
      );
    }
    if (["json", "xml", "txt"].includes(ext || "")) {
      return (
        <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20 shrink-0">
          <FileCode className="w-5 h-5" />
        </div>
      );
    }
    return (
      <div className="p-2 rounded-lg bg-slate-500/10 text-slate-500 border border-slate-500/20 shrink-0">
        <File className="w-5 h-5" />
      </div>
    );
  };

  return (
    <div className="space-y-1 max-w-[320px] sm:max-w-[360px]">
      <div
        className={clsx(
          "flex items-center gap-3 p-2.5 rounded-xl border transition-all",
          isUserMessage
            ? "bg-white/10 border-white/20 text-white"
            : "bg-background/80 border-border/70 text-foreground hover:bg-background"
        )}
      >
        {renderIcon()}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-xs font-semibold truncate leading-tight">{fileName}</p>
            {aiProcessed && (
              <span
                className="shrink-0 flex items-center gap-0.5 px-1.5 py-0.2 rounded-full bg-primary/15 text-primary text-[9px] font-bold"
                title={t("inbox.ai_processed_tooltip")}
              >
                <Sparkles className="w-2.5 h-2.5" />
                <span>AI</span>
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-[10px] opacity-75 font-mono tabular-nums mt-0.5">
            {ext && <span className="uppercase font-bold">{ext}</span>}
            {sizeLabel && <span>• {sizeLabel}</span>}
          </div>
        </div>

        {/* Browser preview + download to Downloads folder */}
        <AttachmentActions mediaUrl={mediaUrl} fileName={fileName} />
      </div>

      {/* Extracted Markdown/Plain-Text Table Accordion */}
      {extractedText && (
        <ExtractedTextPreview
          extractedText={extractedText}
          isUserMessage={isUserMessage}
        />
      )}
    </div>
  );
}
