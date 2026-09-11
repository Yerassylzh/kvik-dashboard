"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Bot, User, UserCheck, ShieldAlert } from "lucide-react";
import type { DevMessage } from "@/lib/api/devMessaging";

interface DevMessageBubbleProps {
  message: DevMessage;
}

export function DevMessageBubble({ message }: DevMessageBubbleProps) {
  const t = useTranslations("dashboard");

  const isUser = message.role === "USER";
  const isBot = message.role === "BOT";
  const isManager = message.role === "MANAGER";

  const timeFormatted = React.useMemo(() => {
    try {
      const d = new Date(message.createdAt);
      return d.toLocaleTimeString("ru-RU", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch {
      return "";
    }
  }, [message.createdAt]);

  const roleLabel = React.useMemo(() => {
    switch (message.role) {
      case "USER":
        return t("dev_messaging.role_user");
      case "BOT":
        return t("dev_messaging.role_bot");
      case "MANAGER":
        return t("dev_messaging.role_manager");
      default:
        return t("dev_messaging.role_system");
    }
  }, [message.role, t]);

  return (
    <div
      className={`flex flex-col gap-1 text-xs ${
        isUser ? "items-start" : "items-start"
      }`}
    >
      {/* Header with avatar & role pill & timestamp */}
      <div className="flex items-center gap-1.5 px-1">
        {isBot && (
          <div className="w-4 h-4 rounded-full bg-accent-ai/20 text-accent-ai flex items-center justify-center">
            <Bot className="w-2.5 h-2.5" />
          </div>
        )}
        {isUser && (
          <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <User className="w-2.5 h-2.5" />
          </div>
        )}
        {isManager && (
          <div className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <UserCheck className="w-2.5 h-2.5" />
          </div>
        )}
        {!isBot && !isUser && !isManager && (
          <div className="w-4 h-4 rounded-full bg-muted text-muted-foreground flex items-center justify-center">
            <ShieldAlert className="w-2.5 h-2.5" />
          </div>
        )}

        <span
          className={`font-semibold text-[10px] uppercase tracking-wider ${
            isBot
              ? "text-accent-ai"
              : isUser
              ? "text-emerald-600 dark:text-emerald-400"
              : isManager
              ? "text-amber-600 dark:text-amber-400"
              : "text-muted-foreground"
          }`}
        >
          {roleLabel}
        </span>

        {timeFormatted && (
          <span className="text-[10px] text-muted-foreground/70 font-mono">
            {timeFormatted}
          </span>
        )}
      </div>

      {/* Bubble text */}
      <div
        className={`px-3.5 py-2.5 rounded-2xl max-w-[90%] sm:max-w-[85%] text-xs leading-relaxed whitespace-pre-wrap break-words border ${
          isBot
            ? "bg-primary/5 text-foreground border-accent-ai/30 shadow-xs"
            : isUser
            ? "bg-card text-foreground border-border/70"
            : isManager
            ? "bg-amber-500/10 text-foreground border-amber-500/30"
            : "bg-muted/40 text-muted-foreground border-border/40"
        }`}
      >
        {message.content}
      </div>
    </div>
  );
}
