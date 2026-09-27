"use client";

import React from "react";
import { Bot, User, ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import clsx from "clsx";
import type { MessageDto, MessageMediaMetadata } from "@/lib/api/conversations";
import { VoiceMessagePlayer } from "./media/VoiceMessagePlayer";
import { ImageAttachment } from "./media/ImageAttachment";
import { VideoAttachment } from "./media/VideoAttachment";
import { DocumentAttachment } from "./media/DocumentAttachment";
import { WeirdFileAlertCard } from "./media/WeirdFileAlertCard";
import { HeavyMediaEscalationCard } from "./media/HeavyMediaEscalationCard";

interface MessageBubbleProps {
  message: MessageDto;
}

/** Helper to identify backend-generated semantic tags, file labels, or duplicate AI descriptions */
function isSyntheticMediaPlaceholder(content?: string, metadata?: MessageMediaMetadata): boolean {
  if (!content) return true;
  const trimmed = content.trim();
  if (!trimmed) return true;

  // Match against metadata file names, AI descriptions, or extracted texts
  if (metadata?.fileName && trimmed === metadata.fileName.trim()) return true;
  if (
    metadata?.aiDescription &&
    (trimmed === metadata.aiDescription.trim() || trimmed.includes(metadata.aiDescription.trim()))
  ) {
    return true;
  }
  if (
    metadata?.extractedText &&
    (trimmed === metadata.extractedText.trim() || trimmed.includes(metadata.extractedText.trim()))
  ) {
    return true;
  }

  // Voice note indicator
  if (trimmed.startsWith("🎤")) return true;

  // Regex for backend semantic placeholder tags:
  // e.g. 📷 [Фотография: ...], [📷 Фотография: ...], [Фотография: ...], 📷 [Фотография], [🎥 Видеозапись: ...], [📄 Документ: ...], [📎 Файл: ...]
  const syntheticMediaPattern =
    /^(\s*[-—–]?\s*\[?\s*(📷|🎥|📄|📎)?\s*\[?\s*(Фотография|Фото|Видеозапись|Видео|Документ|Файл|Голосовое сообщение)[\s\S]*?\]?\s*)+$/i;
  if (syntheticMediaPattern.test(trimmed)) return true;

  return false;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const t = useTranslations("dashboard");
  const isUser = message.role === "USER";
  const isBot = message.role === "BOT";
  const isManager = message.role === "MANAGER";

  const time = new Date(message.createdAt).toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const metadata = message.metadata as MessageMediaMetadata | undefined;
  const mediaType = metadata?.mediaType;
  const mediaUrl = metadata?.mediaUrl;
  const tier = metadata?.aiProcessingTier;

  // Decide whether to render separate text content (e.g. caption for media vs pure text message)
  const isVoice = mediaType === "AUDIO";
  const hasMedia = Boolean(mediaUrl || mediaType);
  const shouldRenderText = hasMedia
    ? !isVoice && Boolean(message.content && !isSyntheticMediaPlaceholder(message.content, metadata))
    : Boolean(message.content && message.content.trim().length > 0);

  return (
    <div
      className={clsx(
        "flex items-end gap-2.5 my-3 max-w-[85%] sm:max-w-[75%]",
        isUser ? "mr-auto" : "ml-auto flex-row-reverse"
      )}
    >
      {/* Role Avatar */}
      <div
        className={clsx(
          "w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs shadow-2xs",
          isUser && "bg-muted text-muted-foreground",
          isBot && "bg-primary/20 text-primary border border-primary/30",
          isManager && "bg-amber-500/20 text-amber-500 border border-amber-500/30"
        )}
      >
        {isUser && <User className="w-4 h-4" />}
        {isBot && <Bot className="w-4 h-4" />}
        {isManager && <ShieldCheck className="w-4 h-4" />}
      </div>

      {/* Bubble Box */}
      <div
        className={clsx(
          "relative px-4 py-2.5 rounded-2xl text-sm shadow-xs transition-all",
          isUser && "bg-primary text-primary-foreground rounded-br-xs",
          isBot && "bg-card border border-border text-foreground rounded-bl-xs",
          isManager && "bg-slate-50 border border-slate-200 text-foreground rounded-bl-xs"
        )}
      >
        {/* Role & Time Header */}
        <div className="flex items-center justify-between gap-3 text-[11px] mb-1.5 opacity-75 font-semibold">
          <span>
            {isUser && t("inbox.sender_client")}
            {isBot && t("inbox.sender_bot")}
            {isManager && (message.senderName || t("inbox.sender_manager"))}
          </span>
          <span className="text-[10px] font-mono opacity-80 tabular-nums">{time}</span>
        </div>

        {/* Media Attachments */}
        {mediaUrl && (
          <div className="my-1">
            {tier === "WEIRD_BINARY" ? (
              <WeirdFileAlertCard
                mediaUrl={mediaUrl}
                fileName={metadata?.fileName}
                fileSize={metadata?.fileSize}
                mimeType={metadata?.mimeType}
                escalationReason={metadata?.escalationReason}
                isUserMessage={isUser}
              />
            ) : tier === "HEAVY_ESCALATION" ? (
              <HeavyMediaEscalationCard
                mediaUrl={mediaUrl}
                mediaType={mediaType}
                fileName={metadata?.fileName}
                durationSeconds={metadata?.durationSeconds}
                fileSize={metadata?.fileSize}
                mimeType={metadata?.mimeType}
                escalationReason={metadata?.escalationReason}
                isUserMessage={isUser}
              />
            ) : (
              <>
                {mediaType === "AUDIO" && (
                  <VoiceMessagePlayer
                    mediaUrl={mediaUrl}
                    durationSeconds={metadata?.durationSeconds}
                    transcription={
                      metadata?.transcription ||
                      (message.content?.startsWith("🎤 ") &&
                      !message.content.includes("Голосовое сообщение")
                        ? message.content.slice(2).trim()
                        : undefined)
                    }
                    detectedLanguage={metadata?.detectedLanguage}
                    transcriptionConfidence={metadata?.transcriptionConfidence}
                    transcriptionError={metadata?.transcriptionError}
                    isUserMessage={isUser}
                  />
                )}

                {mediaType === "IMAGE" && (
                  <ImageAttachment
                    mediaUrl={mediaUrl}
                    fileName={metadata?.fileName}
                    aiProcessed={metadata?.aiProcessed}
                    aiDescription={metadata?.aiDescription}
                    isUserMessage={isUser}
                  />
                )}

                {mediaType === "VIDEO" && (
                  <VideoAttachment
                    mediaUrl={mediaUrl}
                    fileName={metadata?.fileName}
                    durationSeconds={metadata?.durationSeconds}
                    fileSize={metadata?.fileSize}
                    isUserMessage={isUser}
                  />
                )}

                {mediaType === "DOCUMENT" && (
                  <DocumentAttachment
                    mediaUrl={mediaUrl}
                    fileName={metadata?.fileName}
                    fileSize={metadata?.fileSize}
                    mimeType={metadata?.mimeType}
                    extractedText={metadata?.extractedText}
                    aiProcessed={metadata?.aiProcessed}
                    isUserMessage={isUser}
                  />
                )}
              </>
            )}
          </div>
        )}

        {/* Text Content or Caption */}
        {shouldRenderText && (
          <p
            className={clsx(
              "whitespace-pre-wrap break-words leading-relaxed",
              mediaUrl && "mt-2 pt-1 border-t border-black/10 dark:border-white/10"
            )}
          >
            {message.content}
          </p>
        )}
      </div>
    </div>
  );
}
