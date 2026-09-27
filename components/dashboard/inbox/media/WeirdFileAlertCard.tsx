"use client";

import React from "react";
import { ShieldAlert, FileCode } from "lucide-react";
import { useTranslations } from "next-intl";
import { AttachmentActions } from "./AttachmentActions";
import clsx from "clsx";

interface WeirdFileAlertCardProps {
  mediaUrl: string;
  fileName?: string;
  fileSize?: number | null;
  mimeType?: string | null;
  escalationReason?: string | null;
  isUserMessage?: boolean;
}

export function WeirdFileAlertCard({
  mediaUrl,
  fileName = "system-file.bin",
  fileSize,
  mimeType,
  escalationReason,
  isUserMessage = false,
}: WeirdFileAlertCardProps) {
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

  return (
    <div
      className={clsx(
        "rounded-xl border p-3 max-w-[320px] sm:max-w-[360px] space-y-2.5 transition-all",
        isUserMessage
          ? "bg-amber-950/30 border-amber-500/30 text-white"
          : "bg-amber-500/5 border-amber-500/25 text-foreground"
      )}
    >
      {/* Header Badge */}
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-500 shrink-0">
          <ShieldAlert className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold text-amber-600 dark:text-amber-400 leading-tight">
            {t("inbox.weird_file_title")}
          </p>
          <p className="text-[10px] opacity-80 leading-tight mt-0.5">
            {t("inbox.weird_file_desc")}
          </p>
        </div>
      </div>

      {/* File Info & Action */}
      <div
        className={clsx(
          "flex items-center justify-between gap-2.5 p-2 rounded-lg border",
          isUserMessage
            ? "bg-black/20 border-white/10"
            : "bg-background/80 border-border/60"
        )}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <FileCode className="w-4 h-4 text-amber-500 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold truncate leading-tight">{fileName}</p>
            <div className="flex items-center gap-1.5 text-[10px] opacity-75 font-mono tabular-nums mt-0.5">
              {ext && <span className="uppercase font-bold text-amber-600 dark:text-amber-400">{ext}</span>}
              {sizeLabel && <span>• {sizeLabel}</span>}
            </div>
          </div>
        </div>

        <AttachmentActions mediaUrl={mediaUrl} fileName={fileName} />
      </div>
    </div>
  );
}
