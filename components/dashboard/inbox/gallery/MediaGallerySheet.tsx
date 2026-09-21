"use client";

import React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { FileImage, Loader2, Image as ImageIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMediaGallery, type MediaFilterType } from "@/hooks/useMediaGallery";
import { MediaGalleryItem } from "./MediaGalleryItem";
import clsx from "clsx";

interface MediaGallerySheetProps {
  conversationId: string;
  trigger?: React.ReactNode;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function MediaGallerySheet({
  conversationId,
  trigger,
  isOpen,
  onOpenChange,
}: MediaGallerySheetProps) {
  const t = useTranslations("dashboard");
  const {
    mediaItems,
    total,
    filterType,
    setFilterType,
    isLoading,
  } = useMediaGallery(conversationId);

  const tabs: Array<{ id: MediaFilterType; labelKey: string }> = [
    { id: "ALL", labelKey: "inbox.media_tab_all" },
    { id: "IMAGE", labelKey: "inbox.media_tab_photos" },
    { id: "AUDIO", labelKey: "inbox.media_tab_voice" },
    { id: "VIDEO", labelKey: "inbox.media_tab_videos" },
    { id: "DOCUMENT", labelKey: "inbox.media_tab_files" },
  ];

  const isGridType = filterType === "IMAGE" || filterType === "VIDEO";

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      {trigger && <SheetTrigger asChild>{trigger}</SheetTrigger>}

      <SheetContent
        side="right"
        className="w-full sm:max-w-md md:max-w-lg p-0 flex flex-col bg-background"
      >
        {/* Header */}
        <SheetHeader className="p-4 border-b border-border/70 bg-card/60">
          <SheetTitle className="text-sm font-bold text-foreground flex items-center gap-2">
            <FileImage className="w-4 h-4 text-primary" />
            <span>{t("inbox.media_gallery_title")}</span>
            <span className="text-xs font-mono tabular-nums px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-normal">
              {total}
            </span>
          </SheetTitle>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto themed-scroll pt-2 pb-1">
            {tabs.map((tab) => {
              const isActive = filterType === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilterType(tab.id)}
                  className={clsx(
                    "px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer",
                    isActive
                      ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                      : "bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  {t(tab.labelKey as any)}
                </button>
              );
            })}
          </div>
        </SheetHeader>

        {/* Media List / Grid */}
        <div className="flex-1 overflow-y-auto p-4 themed-scroll">
          {isLoading ? (
            <div className="flex items-center justify-center py-20 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          ) : mediaItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center text-muted-foreground space-y-2">
              <div className="w-10 h-10 rounded-full bg-muted/60 flex items-center justify-center">
                <ImageIcon className="w-5 h-5 opacity-40" />
              </div>
              <p className="text-xs">{t("inbox.media_gallery_empty")}</p>
            </div>
          ) : isGridType ? (
            <div className="grid grid-cols-3 gap-2.5">
              {mediaItems.map((item) => (
                <MediaGalleryItem key={item.messageId} item={item} />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {mediaItems.map((item) => (
                <MediaGalleryItem key={item.messageId} item={item} />
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
