"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

interface ManagerComposerProps {
  onSendMessage: (content: string) => Promise<unknown>;
  disabled?: boolean;
}

export function ManagerComposer({ onSendMessage, disabled }: ManagerComposerProps) {
  const t = useTranslations("dashboard");
  const [content, setContent] = useState("");
  const [isSending, setIsSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = async () => {
    if (!content.trim() || isSending || disabled) return;

    const textToSend = content.trim();
    setContent("");
    setIsSending(true);

    try {
      await onSendMessage(textToSend);
    } catch {
      setContent(textToSend); // Restore on error
    } finally {
      setIsSending(false);
      textareaRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="p-3 border-t border-border/60 bg-card/80 backdrop-blur-sm">
      <div className="flex items-end gap-2 bg-muted/40 border border-border/60 rounded-2xl p-2 focus-within:border-primary/60 transition-colors">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t("inbox.composer_placeholder")}
          rows={1}
          disabled={disabled || isSending}
          className="flex-1 bg-transparent resize-none px-2 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none max-h-32 min-h-[38px]"
        />

        <Button
          type="button"
          size="sm"
          onClick={handleSend}
          disabled={!content.trim() || isSending || disabled}
          className="rounded-xl shrink-0 gap-1.5 h-9 px-3.5"
        >
          <span>{t("inbox.send_btn")}</span>
          <Send className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}
