"use client";

import React from "react";
import { FileText, FileSpreadsheet, FileCode, Download, File } from "lucide-react";
import { useTranslations } from "next-intl";
import clsx from "clsx";

interface DocumentAttachmentProps {
  mediaUrl: string;
  fileName?: string;
  fileSize?: number | null;
  mimeType?: string | null;
  isUserMessage?: boolean;
}

export function DocumentAttachment({
  mediaUrl,
  fileName = "document.pdf",
  fileSize,
  mimeType,
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
    <div
      className={clsx(
        "flex items-center gap-3 p-2.5 rounded-xl border transition-all max-w-[320px] sm:max-w-[360px]",
        isUserMessage
          ? "bg-white/10 border-white/20 text-white"
          : "bg-background/80 border-border/70 text-foreground hover:bg-background"
      )}
    >
      {renderIcon()}

      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold truncate leading-tight">{fileName}</p>
        <div className="flex items-center gap-2 text-[10px] opacity-75 font-mono tabular-nums mt-0.5">
          {ext && <span className="uppercase font-bold">{ext}</span>}
          {sizeLabel && <span>• {sizeLabel}</span>}
        </div>
      </div>

      <a
        href={mediaUrl}
        download={fileName}
        target="_blank"
        rel="noopener noreferrer"
        className={clsx(
          "p-2 rounded-lg transition-colors shrink-0 cursor-pointer",
          isUserMessage
            ? "hover:bg-white/20 text-white"
            : "hover:bg-muted text-muted-foreground hover:text-foreground"
        )}
        title={t("inbox.download_file")}
      >
        <Download className="w-4 h-4" />
      </a>
    </div>
  );
}
