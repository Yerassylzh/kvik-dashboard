"use client";

import React from "react";
import { Bot, User } from "lucide-react";
import { useTranslations } from "next-intl";
import clsx from "clsx";

interface TypingIndicatorProps {
  role?: "bot" | "user";
  className?: string;
}

export function TypingIndicator({ role = "bot", className }: TypingIndicatorProps) {
  const t = useTranslations("dashboard");
  const isBot = role === "bot";

  return (
    <div
      className={clsx(
        "flex items-end gap-2.5 my-2 max-w-[85%] sm:max-w-[75%] animate-in fade-in duration-200",
        isBot ? "mr-auto" : "mr-auto",
        className
      )}
    >
      {/* Role Avatar */}
      <div
        className={clsx(
          "w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs shadow-2xs",
          isBot
            ? "bg-primary/20 text-primary border border-primary/30"
            : "bg-muted text-muted-foreground"
        )}
      >
        {isBot ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
      </div>

      {/* Typing Bubble */}
      <div
        className={clsx(
          "flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl text-xs shadow-xs border",
          isBot
            ? "bg-card border-border text-foreground rounded-bl-xs"
            : "bg-muted/70 border-border/70 text-foreground rounded-bl-xs"
        )}
      >
        <span className="text-muted-foreground font-medium">
          {isBot ? t("inbox.typing_ai") : t("inbox.typing_user")}
        </span>

        {/* 3 gentle animated dots */}
        <span className="flex items-center gap-1">
          <span
            className={clsx(
              "w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:-0.3s]",
              isBot ? "bg-primary/80" : "bg-muted-foreground/80"
            )}
          />
          <span
            className={clsx(
              "w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:-0.15s]",
              isBot ? "bg-primary/80" : "bg-muted-foreground/80"
            )}
          />
          <span
            className={clsx(
              "w-1.5 h-1.5 rounded-full animate-bounce",
              isBot ? "bg-primary/80" : "bg-muted-foreground/80"
            )}
          />
        </span>
      </div>
    </div>
  );
}
