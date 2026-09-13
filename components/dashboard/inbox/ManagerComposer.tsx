"use client";

import React, { useState, useRef } from "react";
import { Send, ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth.store";

interface ManagerComposerProps {
  onSendMessage: (content: string) => Promise<unknown>;
  disabled?: boolean;
}

export function ManagerComposer({ onSendMessage, disabled }: ManagerComposerProps) {
  const t = useTranslations("dashboard");
  const [content, setContent] = useState("");
  const [isSending, setIsSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const user = useAuthStore((s) => s.user);

  const senderLabel = user?.staffProfile?.name
    ? `${user.staffProfile.name}${user.staffProfile.role ? ` (${user.staffProfile.role})` : ''}`
    : t('inbox.sender_manager');

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
    <div className="p-3 border-t border-border/60 bg-card/80 backdrop-blur-sm space-y-2">
      {/* Active responder identity badge */}
      <div className="flex items-center gap-1.5 text-[11px] text-amber-600 font-semibold px-1">
        <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
        <span>{t('inbox.sender_prefix')} {senderLabel}</span>
      </div>

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
          loading={isSending}
          disabled={!content.trim() || isSending || disabled}
          rightIcon={<Send className="w-3.5 h-3.5" />}
          className="rounded-xl shrink-0 h-9 px-3.5"
        >
          {t("inbox.send_btn")}
        </Button>
      </div>
    </div>
  );
}

