"use client";

import React, { useState } from "react";
import { ImageOff } from "lucide-react";
import { useTranslations } from "next-intl";
import { MediaLightboxModal } from "./MediaLightboxModal";
import { AttachmentActions } from "./AttachmentActions";
import { useMediaObjectSrc } from "@/hooks/useMediaObjectSrc";
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
  const { src, loading } = useMediaObjectSrc(mediaUrl);
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
        {(!isLoaded || loading) && (
          <div className="w-64 h-44 bg-muted/60 animate-pulse flex items-center justify-center text-muted-foreground" />
        )}

        {src && (
          <img
            src={src}
            alt={fileName || "Image attachment"}
            onLoad={() => setIsLoaded(true)}
            onError={() => setHasError(true)}
            className={clsx(
              "w-full h-auto max-h-[280px] object-cover rounded-xl transition-all duration-200 group-hover:scale-[1.02]",
              !isLoaded && "hidden"
            )}
          />
        )}

        {/* Hover badge: browser preview + download to Downloads folder */}
        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 rounded-full bg-black/60 text-white backdrop-blur-xs shadow-md p-0.5 [&_button]:text-white [&_button:hover]:bg-white/20">
          <AttachmentActions mediaUrl={mediaUrl} fileName={fileName} />
        </div>
      </div>

      <MediaLightboxModal
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        mediaUrl={src || mediaUrl}
        mediaType="IMAGE"
        fileName={fileName}
      />
    </>
  );
}
