"use client";

import React, { useEffect, useState } from "react";
import { X, FileText, Music, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import type { MediaType } from "@/lib/api/conversations";

interface PendingMediaPreviewProps {
  file: File;
  mediaType: MediaType;
  isUploading: boolean;
  onRemove: () => void;
}

export function PendingMediaPreview({
  file,
  mediaType,
  isUploading,
  onRemove,
}: PendingMediaPreviewProps) {
  const t = useTranslations("dashboard");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (mediaType === "IMAGE" || mediaType === "VIDEO") {
      const url = URL.createObjectURL(file);
      queueMicrotask(() => {
        setPreviewUrl(url);
      });
      return () => URL.revokeObjectURL(url);
    }
  }, [file, mediaType]);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
  };

  return (
    <div className="flex items-center gap-3 p-2 bg-muted/60 border border-border/70 rounded-xl relative overflow-hidden animate-in fade-in duration-150">
      {/* Thumbnail or Icon */}
      <div className="w-12 h-12 rounded-lg bg-card border border-border/60 overflow-hidden flex items-center justify-center shrink-0">
        {mediaType === "IMAGE" && previewUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
        ) : mediaType === "VIDEO" && previewUrl ? (
          <video src={previewUrl} className="w-full h-full object-cover" />
        ) : mediaType === "AUDIO" ? (
          <Music className="w-5 h-5 text-primary" />
        ) : (
          <FileText className="w-5 h-5 text-rose-500" />
        )}
      </div>

      {/* File Info */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-foreground truncate">{file.name}</p>
        <p className="text-[10px] font-mono text-muted-foreground tabular-nums mt-0.5">
          {formatFileSize(file.size)} • {mediaType}
        </p>

        {isUploading && (
          <div className="flex items-center gap-1.5 mt-1 text-[10px] text-primary font-medium">
            <Loader2 className="w-3 h-3 animate-spin shrink-0" />
            <span>{t("inbox.uploading_media")}</span>
          </div>
        )}
      </div>

      {/* Remove Button */}
      <button
        type="button"
        disabled={isUploading}
        onClick={onRemove}
        className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer shrink-0 disabled:opacity-40"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Progress Bar (Indeterminate) */}
      {isUploading && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary/20 overflow-hidden">
          <div className="w-full h-full bg-primary animate-pulse" />
        </div>
      )}
    </div>
  );
}
