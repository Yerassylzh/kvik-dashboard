"use client";

import React, { useState } from "react";
import { ImageOff, Sparkles, ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { MediaLightboxModal } from "./MediaLightboxModal";
import { AttachmentActions } from "./AttachmentActions";
import { useMediaObjectSrc } from "@/hooks/useMediaObjectSrc";
import clsx from "clsx";

interface ImageAttachmentProps {
  mediaUrl: string;
  fileName?: string;
  isUserMessage?: boolean;
  aiProcessed?: boolean;
  aiDescription?: string;
}

export function ImageAttachment({
  mediaUrl,
  fileName,
  isUserMessage = false,
  aiProcessed,
  aiDescription,
}: ImageAttachmentProps) {
  const t = useTranslations("dashboard");
  const { src, loading } = useMediaObjectSrc(mediaUrl);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isDescriptionOpen, setIsDescriptionOpen] = useState(false);

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

        {/* AI Analyzed Badge */}
        {aiProcessed && (
          <div
            className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/90 text-white text-[10px] font-semibold backdrop-blur-xs shadow-xs z-10"
            title={aiDescription || t("inbox.ai_processed_tooltip")}
          >
            <Sparkles className="w-3 h-3" />
            <span>{t("inbox.ai_processed_badge")}</span>
          </div>
        )}

        {/* Hover badge: browser preview + download to Downloads folder */}
        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 rounded-full bg-black/60 text-white backdrop-blur-xs shadow-md p-0.5 [&_button]:text-white [&_button:hover]:bg-white/20">
          <AttachmentActions mediaUrl={mediaUrl} fileName={fileName} />
        </div>
      </div>

      {/* Collapsible AI Description Accordion */}
      {aiDescription && (
        <div className="mt-1.5 w-full max-w-[280px] sm:max-w-[320px]">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsDescriptionOpen((prev) => !prev);
            }}
            className={clsx(
              "flex items-center justify-between w-full px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors cursor-pointer",
              isUserMessage
                ? "bg-white/10 hover:bg-white/15 text-white/90 border border-white/20"
                : "bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/50"
            )}
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <Sparkles className="w-3 h-3 shrink-0 opacity-80 text-amber-400" />
              <span className="truncate">
                {isDescriptionOpen
                  ? t("inbox.ai_description_toggle_hide")
                  : t("inbox.ai_description_toggle_show")}
              </span>
            </div>
            <ChevronDown
              className={clsx(
                "w-3.5 h-3.5 shrink-0 transition-transform duration-200 opacity-75",
                isDescriptionOpen && "rotate-180"
              )}
            />
          </button>

          {isDescriptionOpen && (
            <div
              className={clsx(
                "mt-1 p-2.5 rounded-lg text-xs leading-relaxed italic border animate-in fade-in duration-150 whitespace-pre-wrap break-words",
                isUserMessage
                  ? "bg-black/20 border-white/15 text-white/90"
                  : "bg-muted/40 border-border/60 text-muted-foreground"
              )}
            >
              {aiDescription}
            </div>
          )}
        </div>
      )}

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
