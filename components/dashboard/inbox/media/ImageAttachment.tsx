"use client";

import React, { useState } from "react";
import { Maximize2, ImageOff } from "lucide-react";
import { useTranslations } from "next-intl";
import { MediaLightboxModal } from "./MediaLightboxModal";
import clsx from "clsx";

interface ImageAttachmentProps {
  mediaUrl: string;
  fileName?: string;
  isUserMessage?: boolean;
}

export function ImageAttachment({
  mediaUrl,
  fileName,
  isUserMessage = false,
}: ImageAttachmentProps) {
  const t = useTranslations("dashboard");
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  if (hasError) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-xl border border-border/60 bg-muted/40 text-xs text-muted-foreground">
        <ImageOff className="w-4 h-4 text-muted-foreground shrink-0" />
        <span>{t("inbox.media_unavailable")}</span>
      </div>
    );
  }

  return (
    <>
      <div
        onClick={() => setIsLightboxOpen(true)}
        className="group relative cursor-pointer overflow-hidden rounded-xl border border-black/10 shadow-xs max-w-[280px] sm:max-w-[320px] transition-transform active:scale-[0.99]"
      >
        {/* Skeleton while loading */}
        {!isLoaded && (
          <div className="w-64 h-44 bg-muted/60 animate-pulse flex items-center justify-center text-muted-foreground" />
        )}

        <img
          src={mediaUrl}
          alt={fileName || "Image attachment"}
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          className={clsx(
            "w-full h-auto max-h-[280px] object-cover rounded-xl transition-all duration-200 group-hover:scale-[1.02]",
            !isLoaded && "hidden"
          )}
        />

        {/* Hover zoom icon badge */}
        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="p-2 rounded-full bg-black/60 text-white backdrop-blur-xs shadow-md">
            <Maximize2 className="w-4 h-4" />
          </div>
        </div>
      </div>

      <MediaLightboxModal
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        mediaUrl={mediaUrl}
        mediaType="IMAGE"
        fileName={fileName}
      />
    </>
  );
}
