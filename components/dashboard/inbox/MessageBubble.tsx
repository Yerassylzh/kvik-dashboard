"use client";

import React from "react";
import { Bot, User, ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import clsx from "clsx";
import type { MessageDto, MessageRole } from "@/lib/api/conversations";

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

  return (
    <div
      className={clsx(
        "flex items-end gap-2.5 my-3 max-w-[80%]",
        isUser ? "ml-auto flex-row-reverse" : "mr-auto"
      )}
    >
      {/* Role Avatar */}
      <div
        className={clsx(
          "w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs",
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
          "relative px-4 py-2.5 rounded-2xl text-sm shadow-sm transition-all",
          isUser &&
            "bg-primary text-primary-foreground rounded-br-xs",
          isBot &&
            "bg-card border border-border text-foreground rounded-bl-xs",
          isManager &&
            "bg-amber-500/10 border border-amber-500/30 text-foreground rounded-bl-xs"
        )}
      >
        {/* Role Tag */}
        <div className="flex items-center justify-between gap-3 text-[11px] mb-1 opacity-75 font-semibold">
          <span>
            {isUser && t("inbox.sender_client")}
            {isBot && t("inbox.sender_bot")}
            {isManager && (message.senderName || t("inbox.sender_manager"))}
          </span>
          <span className="text-[10px] font-mono opacity-80">{time}</span>
        </div>

        <p className="whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>
      </div>
    </div>
  );
}
