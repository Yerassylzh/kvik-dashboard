"use client";

import React, { useState } from "react";
import {
  FileText,
  FileSpreadsheet,
  FileCode,
  File,
  Play,
  Maximize2,
  Music,
} from "lucide-react";
import { useTranslations } from "next-intl";
import type { MediaItemDto } from "@/lib/api/conversations";
import { MediaLightboxModal } from "../media/MediaLightboxModal";
import { AttachmentActions } from "../media/AttachmentActions";
import { useMediaObjectSrc } from "@/hooks/useMediaObjectSrc";
import clsx from "clsx";

interface MediaGalleryItemProps {
  item: MediaItemDto;
}

export function MediaGalleryItem({ item }: MediaGalleryItemProps) {
  const t = useTranslations("dashboard");
  const { src } = useMediaObjectSrc(item.mediaUrl);
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
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src || undefined}
            alt={item.fileName || "Photo"}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
          />

          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Maximize2 className="w-4 h-4 text-white" />
          </div>

          {/* Hover badge: browser preview + download to Downloads folder */}
          <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg bg-black/60 backdrop-blur-xs p-0.5 [&_button]:text-white [&_button:hover]:bg-white/20">
            <AttachmentActions mediaUrl={item.mediaUrl} fileName={item.fileName} />
          </div>

          <div className="absolute bottom-1 right-1 px-1 rounded bg-black/60 text-[9px] font-mono tabular-nums text-white">
            {timeLabel}
          </div>
        </div>

        <MediaLightboxModal
          isOpen={isLightboxOpen}
          onClose={() => setIsLightboxOpen(false)}
          mediaUrl={src || item.mediaUrl}
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
            src={src || undefined}
            preload="metadata"
            className="w-full h-full object-cover opacity-80"
          />

          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full bg-black/70 text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
              <Play className="w-4 h-4 fill-current ml-0.5" />
            </div>
          </div>

          {/* Hover badge: browser preview + download to Downloads folder */}
          <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg bg-black/60 backdrop-blur-xs p-0.5 [&_button]:text-white [&_button:hover]:bg-white/20">
            <AttachmentActions mediaUrl={item.mediaUrl} fileName={item.fileName} />
          </div>

          <div className="absolute bottom-1 right-1 px-1 rounded bg-black/70 text-[9px] font-mono tabular-nums text-white">
            {timeLabel}
          </div>
        </div>

        <MediaLightboxModal
          isOpen={isLightboxOpen}
          onClose={() => setIsLightboxOpen(false)}
          mediaUrl={src || item.mediaUrl}
          mediaType="VIDEO"
          fileName={item.fileName}
        />
      </>
    );
  }

  // 3. Audio Item
  if (item.mediaType === "AUDIO") {
    const hasTranscript = Boolean(item.transcription && item.transcription.trim().length > 0);
    const transcriptSnippet = item.transcription?.trim();
    const isManager = item.role === "MANAGER";
    const isUser = item.role === "USER";

    const senderBadgeLabel = isUser
      ? t("inbox.sender_client")
      : isManager
      ? (item.senderName || t("inbox.sender_manager"))
      : t("inbox.sender_bot");

    return (
      <div className="p-3 rounded-xl border border-border/70 bg-card hover:bg-muted/30 transition-colors space-y-2">
        <div className="flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={clsx(
                "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                isManager
                  ? "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                  : isUser
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "bg-muted text-muted-foreground"
              )}
            >
              <Music className="w-4 h-4" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <p className="text-xs font-semibold text-foreground truncate">
                  {item.caption || item.fileName || t("inbox.media_tab_voice")}
                </p>
                <span
                  className={clsx(
                    "text-[10px] px-1.5 py-0.2 rounded font-medium shrink-0",
                    isManager
                      ? "bg-amber-50 text-amber-700 border border-amber-200"
                      : isUser
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {senderBadgeLabel}
                </span>
              </div>
              <p className="text-[10px] font-mono text-muted-foreground tabular-nums mt-0.5">
                {timeLabel} {item.durationSeconds ? `• ${Math.round(item.durationSeconds)}с` : ""}
                {item.detectedLanguage ? ` • ${item.detectedLanguage.toUpperCase()}` : ""}
              </p>
            </div>
          </div>

          <AttachmentActions mediaUrl={item.mediaUrl} fileName={item.fileName || "voice.ogg"} />
        </div>

        {/* Transcribed text snippet */}
        {hasTranscript && (
          <div className="px-2.5 py-2 rounded-lg bg-muted/50 border border-border/40 text-[11px] leading-relaxed text-foreground">
            <p className="line-clamp-3 text-muted-foreground italic">
              “{transcriptSnippet}”
            </p>
          </div>
        )}
      </div>
    );
  }

  // 4. Document Item
  const renderDocIcon = () => {
    if (ext === "pdf") {
      return (
        <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-500 border border-rose-500/20 flex items-center justify-center shrink-0">
          <FileText className="w-4 h-4" />
        </div>
      );
    }
    if (["xlsx", "xls", "csv"].includes(ext || "")) {
      return (
        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center shrink-0">
          <FileSpreadsheet className="w-4 h-4" />
        </div>
      );
    }
    if (["docx", "doc", "rtf"].includes(ext || "")) {
      return (
        <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-500 border border-sky-500/20 flex items-center justify-center shrink-0">
          <FileText className="w-4 h-4" />
        </div>
      );
    }
    if (["json", "xml", "p12", "key", "pem", "crt", "cer", "zip", "rar", "7z"].includes(ext || "")) {
      return (
        <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center shrink-0">
          <FileCode className="w-4 h-4" />
        </div>
      );
    }
    return (
      <div className="w-8 h-8 rounded-lg bg-slate-500/10 text-slate-500 border border-slate-500/20 flex items-center justify-center shrink-0">
        <File className="w-4 h-4" />
      </div>
    );
  };

  return (
    <div className="flex items-center justify-between gap-2.5 p-2.5 rounded-xl border border-border/70 bg-card hover:bg-muted/40 transition-colors">
      <div className="flex items-center gap-2 min-w-0">
        {renderDocIcon()}

        <div className="min-w-0">
          <p className="text-xs font-semibold text-foreground truncate leading-tight">
            {item.fileName || "document.pdf"}
          </p>
          <p className="text-[10px] font-mono text-muted-foreground tabular-nums mt-0.5">
            {timeLabel} {sizeLabel ? `• ${sizeLabel}` : ""}
          </p>
        </div>
      </div>

      <AttachmentActions mediaUrl={item.mediaUrl} fileName={item.fileName || "document"} />
    </div>
  );
}
