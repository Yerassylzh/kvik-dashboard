"use client";

import React from "react";
import { ArrowDownToLine, ExternalLink } from "lucide-react";
import { useTranslations } from "next-intl";
import clsx from "clsx";
import { downloadFile, openFileInBrowser } from "@/lib/utils/fileDownload";

interface AttachmentActionsProps {
  mediaUrl: string;
  fileName?: string;
  /** "light" = for use on violet primary-colored client bubbles. */
  variant?: "default" | "light";
  className?: string;
}

/**
 * Shared Download + Open action group for attachments.
 * Download saves the file to the browser's default Downloads folder;
 * Open shows the native browser preview in a new tab.
 */
export function AttachmentActions({
  mediaUrl,
  fileName,
  variant = "default",
  className,
}: AttachmentActionsProps) {
  const t = useTranslations("dashboard");

  const baseClasses = clsx(
    "p-1.5 rounded-lg transition-colors shrink-0 cursor-pointer",
    variant === "light"
      ? "hover:bg-white/20 text-primary-foreground/90 hover:text-primary-foreground"
      : "hover:bg-muted text-muted-foreground hover:text-foreground",
    className
  );

  return (
    <div className="flex items-center gap-0.5 shrink-0">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          openFileInBrowser(mediaUrl);
        }}
        className={baseClasses}
        title={t("inbox.open_in_new_tab")}
      >
        <ExternalLink className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          downloadFile(mediaUrl, fileName);
        }}
        className={baseClasses}
        title={t("inbox.download_file")}
      >
        <ArrowDownToLine className="w-4 h-4" />
      </button>
    </div>
  );
}
