"use client";

import React, { useState } from "react";
import {
  FileText,
  FileSpreadsheet,
  FileCode,
  File,
  Download,
  Play,
  Maximize2,
  Music,
} from "lucide-react";
import { useTranslations } from "next-intl";
import type { MediaItemDto } from "@/lib/api/conversations";
import { MediaLightboxModal } from "../media/MediaLightboxModal";
import clsx from "clsx";

interface MediaGalleryItemProps {
  item: MediaItemDto;
}

export function MediaGalleryItem({ item }: MediaGalleryItemProps) {
  const t = useTranslations("dashboard");
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const formatFileSize = (bytes?: number | null) => {
    if (!bytes) return null;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
  };

  const formatTime = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  const getFileExtension = (name?: string) => {
    if (!name) return "";
    const parts = name.split(".");
    return parts.length > 1 ? parts.pop()?.toLowerCase() : "";
  };

  const ext = getFileExtension(item.fileName);
  const sizeLabel = formatFileSize(item.fileSize);
  const timeLabel = formatTime(item.createdAt);

  // 1. Image Thumbnail
  if (item.mediaType === "IMAGE") {
    return (
      <>
        <div
          onClick={() => setIsLightboxOpen(true)}
          className="group relative cursor-pointer aspect-square rounded-xl overflow-hidden border border-border/70 bg-muted/30 transition-transform active:scale-95"
        >
          <img
            src={item.mediaUrl}
            alt={item.fileName || "Photo"}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
          />

          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Maximize2 className="w-4 h-4 text-white" />
          </div>

          <div className="absolute bottom-1 right-1 px-1 rounded bg-black/60 text-[9px] font-mono tabular-nums text-white">
            {timeLabel}
          </div>
        </div>

        <MediaLightboxModal
          isOpen={isLightboxOpen}
          onClose={() => setIsLightboxOpen(false)}
          mediaUrl={item.mediaUrl}
          mediaType="IMAGE"
          fileName={item.fileName}
        />
      </>
    );
  }

  // 2. Video Thumbnail
  if (item.mediaType === "VIDEO") {
    return (
      <>
        <div
          onClick={() => setIsLightboxOpen(true)}
          className="group relative cursor-pointer aspect-square rounded-xl overflow-hidden border border-border/70 bg-black/80 flex items-center justify-center transition-transform active:scale-95"
        >
          <video
            src={item.mediaUrl}
            preload="metadata"
            className="w-full h-full object-cover opacity-80"
          />

          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full bg-black/70 text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
              <Play className="w-4 h-4 fill-current ml-0.5" />
            </div>
          </div>

          <div className="absolute bottom-1 right-1 px-1 rounded bg-black/70 text-[9px] font-mono tabular-nums text-white">
            {timeLabel}
          </div>
        </div>

        <MediaLightboxModal
          isOpen={isLightboxOpen}
          onClose={() => setIsLightboxOpen(false)}
          mediaUrl={item.mediaUrl}
          mediaType="VIDEO"
          fileName={item.fileName}
        />
      </>
    );
  }

  // 3. Audio Item
  if (item.mediaType === "AUDIO") {
    return (
      <div className="flex items-center justify-between gap-2.5 p-2.5 rounded-xl border border-border/70 bg-card hover:bg-muted/40 transition-colors">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Music className="w-4 h-4" />
          </div>

          <div className="min-w-0">
            <p className="text-xs font-semibold text-foreground truncate">
              {item.caption || item.fileName || t("inbox.media_tab_voice")}
            </p>
            <p className="text-[10px] font-mono text-muted-foreground tabular-nums mt-0.5">
              {timeLabel} {item.durationSeconds ? `• ${Math.round(item.durationSeconds)}с` : ""}
            </p>
          </div>
        </div>

        <a
          href={item.mediaUrl}
          download={item.fileName || "voice.ogg"}
          className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0"
          title={t("inbox.download_file")}
        >
          <Download className="w-3.5 h-3.5" />
        </a>
      </div>
    );
  }

  // 4. Document Item
  return (
    <div className="flex items-center justify-between gap-2.5 p-2.5 rounded-xl border border-border/70 bg-card hover:bg-muted/40 transition-colors">
      <div className="flex items-center gap-2 min-w-0">
        <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-500 border border-rose-500/20 flex items-center justify-center shrink-0">
          <FileText className="w-4 h-4" />
        </div>

        <div className="min-w-0">
          <p className="text-xs font-semibold text-foreground truncate leading-tight">
            {item.fileName || "document.pdf"}
          </p>
          <p className="text-[10px] font-mono text-muted-foreground tabular-nums mt-0.5">
            {timeLabel} {sizeLabel ? `• ${sizeLabel}` : ""}
          </p>
        </div>
      </div>

      <a
        href={item.mediaUrl}
        download={item.fileName || "document"}
        target="_blank"
        rel="noopener noreferrer"
        className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0"
        title={t("inbox.download_file")}
      >
        <Download className="w-3.5 h-3.5" />
      </a>
    </div>
  );
}
