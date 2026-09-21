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

interface MessageBubbleProps {
  message: MessageDto;
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

  // Decide whether to render separate text content (e.g. caption for media)
  const isVoice = mediaType === "AUDIO";
  const shouldRenderText =
    message.content &&
    !isVoice &&
    message.content !== metadata?.fileName &&
    !message.content.startsWith("📷 Фотография") &&
    !message.content.startsWith("📄 Документ") &&
    !message.content.startsWith("🎥 Видео");

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
            {mediaType === "AUDIO" && (
              <VoiceMessagePlayer
                mediaUrl={mediaUrl}
                durationSeconds={metadata?.durationSeconds}
                transcription={metadata?.transcription}
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
                isUserMessage={isUser}
              />
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
