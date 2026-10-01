"use client";

import React from "react";
import { AlertCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { VideoAttachment } from "./VideoAttachment";
import { DocumentAttachment } from "./DocumentAttachment";
import clsx from "clsx";

interface HeavyMediaEscalationCardProps {
  mediaUrl: string;
  mediaType?: "VIDEO" | "DOCUMENT" | "IMAGE" | "AUDIO";
  fileName?: string;
  fileSize?: number | null;
  durationSeconds?: number | null;
  mimeType?: string | null;
  escalationReason?: string | null;
  isUserMessage?: boolean;
}

export function HeavyMediaEscalationCard({
  mediaUrl,
  mediaType = "DOCUMENT",
  fileName,
  fileSize,
  durationSeconds,
  isUserMessage = false,
}: HeavyMediaEscalationCardProps) {
  const t = useTranslations("dashboard");

  return (
    <div className="space-y-2 max-w-[320px] sm:max-w-[360px]">
      {/* Notice Banner */}
      <div
        className={clsx(
          "flex items-center gap-2 p-2 rounded-lg border text-xs",
          isUserMessage
            ? "bg-amber-500/20 border-amber-500/30 text-amber-200"
            : "bg-amber-500/10 border-amber-500/25 text-amber-800 dark:text-amber-300"
        )}
      >
        <AlertCircle className="w-4 h-4 shrink-0 text-amber-500" />
        <div className="min-w-0">
          <p className="font-semibold leading-tight">{t("inbox.heavy_media_title")}</p>
          <p className="text-[10px] opacity-85 leading-tight mt-0.5">
            {t("inbox.heavy_media_desc")}
          </p>
        </div>
      </div>

      {/* Embedded Media / Attachment */}
      {mediaType === "VIDEO" ? (
        <VideoAttachment
          mediaUrl={mediaUrl}
          fileName={fileName}
          durationSeconds={durationSeconds}
          fileSize={fileSize}
          isUserMessage={isUserMessage}
        />
      ) : (
        <DocumentAttachment
          mediaUrl={mediaUrl}
          fileName={fileName}
          fileSize={fileSize}
          mimeType={mimeType}
          isUserMessage={isUserMessage}
        />
      )}
    </div>
  );
}
