"use client";

import React from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Download, ExternalLink } from "lucide-react";
import { useTranslations } from "next-intl";

interface MediaLightboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  mediaUrl: string;
  mediaType: "IMAGE" | "VIDEO";
  fileName?: string;
}

export function MediaLightboxModal({
  isOpen,
  onClose,
  mediaUrl,
  mediaType,
  fileName,
}: MediaLightboxModalProps) {
  const t = useTranslations("dashboard");

  if (!mediaUrl) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl p-2 bg-black/95 border-border/20 text-white overflow-hidden">
        <DialogTitle className="sr-only">
          {fileName || t("inbox.media_gallery_title")}
        </DialogTitle>

        {/* Media Preview Container */}
        <div className="relative flex items-center justify-center min-h-[300px] max-h-[80vh] w-full overflow-hidden rounded-lg bg-black/40">
          {mediaType === "IMAGE" ? (
            <img
              src={mediaUrl}
              alt={fileName || "Media preview"}
              className="max-h-[75vh] w-auto max-w-full object-contain rounded-md"
            />
          ) : (
            <video
              src={mediaUrl}
              controls
              autoPlay
              className="max-h-[75vh] w-auto max-w-full rounded-md"
            />
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-3 py-2 border-t border-white/10 text-xs text-white/80">
          <span className="truncate max-w-md font-mono text-[11px]">
            {fileName || mediaUrl.split("/").pop()}
          </span>

          <div className="flex items-center gap-2">
            <a
              href={mediaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition-colors"
              title={t("inbox.open_in_new_tab")}
            >
              <ExternalLink className="w-4 h-4" />
            </a>
            <a
              href={mediaUrl}
              download={fileName || "download"}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white font-medium transition-colors cursor-pointer text-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{t("inbox.download_file")}</span>
            </a>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
