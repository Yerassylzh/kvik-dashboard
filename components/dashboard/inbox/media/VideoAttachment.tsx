"use client";

import React, { useState } from "react";
import { Play, VideoOff, Maximize2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { MediaLightboxModal } from "./MediaLightboxModal";
import clsx from "clsx";

interface VideoAttachmentProps {
  mediaUrl: string;
  fileName?: string;
  durationSeconds?: number | null;
  fileSize?: number | null;
  isUserMessage?: boolean;
}

export function VideoAttachment({
  mediaUrl,
  fileName,
  durationSeconds,
  fileSize,
  isUserMessage = false,
}: VideoAttachmentProps) {
  const t = useTranslations("dashboard");
  const [hasError, setHasError] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const formatFileSize = (bytes?: number | null) => {
    if (!bytes) return null;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
  };

  if (hasError) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-xl border border-border/60 bg-muted/40 text-xs text-muted-foreground">
        <VideoOff className="w-4 h-4 text-muted-foreground shrink-0" />
        <span>{t("inbox.media_unavailable")}</span>
      </div>
    );
  }

  const sizeLabel = formatFileSize(fileSize);

  return (
    <>
      <div className="relative group max-w-[280px] sm:max-w-[340px] rounded-xl overflow-hidden border border-black/10 shadow-xs bg-black">
        <video
          src={mediaUrl}
          controls
          preload="metadata"
          onError={() => setHasError(true)}
          className="w-full max-h-[260px] rounded-xl object-contain"
        />

        {/* Header Overlay for Fullscreen Lightbox */}
        <button
          type="button"
          onClick={() => setIsLightboxOpen(true)}
          className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-white/80 hover:text-white hover:bg-black/80 transition-opacity opacity-0 group-hover:opacity-100 cursor-pointer shadow-xs"
          title={t("inbox.media_gallery_title")}
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>

        {sizeLabel && (
          <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/70 text-[10px] font-mono tabular-nums text-white/90">
            {sizeLabel}
          </div>
        )}
      </div>

      <MediaLightboxModal
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        mediaUrl={mediaUrl}
        mediaType="VIDEO"
        fileName={fileName}
      />
    </>
  );
}
