"use client";

import React, { useState, useRef } from "react";
import { Send, ShieldCheck, Lock, Bot, UserCheck, AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth.store";
import { useInboxStore } from "@/store/inbox.store";
import type { ConversationStatus } from "@/lib/api/conversations";

interface ManagerComposerProps {
  onSendMessage: (content: string) => Promise<unknown>;
  disabled?: boolean;
  conversationId?: string;
  takenOverByActorId?: string | null;
  status?: ConversationStatus;
  onTakeover?: () => Promise<void>;
}

export function ManagerComposer({
  onSendMessage,
  disabled,
  conversationId,
  takenOverByActorId,
  status = "BOT_ACTIVE",
  onTakeover,
}: ManagerComposerProps) {
  const t = useTranslations("dashboard");
  const [content, setContent] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isTakingOver, setIsTakingOver] = useState(false);
  const [isLockedByOther, setIsLockedByOther] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const user = useAuthStore((s) => s.user);
  // actorId mirrors the backend: staffMemberId (staff) or userId (owner)
  const myActorId = user?.staffProfile?.id ?? user?.id;
  const { takenConversationIds } = useInboxStore();

  const senderLabel = user?.staffProfile?.name
    ? `${user.staffProfile.name}${user.staffProfile.role ? ` (${user.staffProfile.role})` : ""}`
    : t("inbox.sender_manager");

  // Determine if this conversation is locked by someone else
  const isAssignedToMe = !!myActorId && takenOverByActorId === myActorId;
  const isLockedExternally =
    (!!takenOverByActorId && !isAssignedToMe) ||
    (!!conversationId && takenConversationIds.has(conversationId));

  const handleTakeoverClick = async () => {
    if (!onTakeover || isTakingOver) return;
    setIsTakingOver(true);
    try {
      await onTakeover();
    } finally {
      setIsTakingOver(false);
    }
  };

  // 1. Closed conversation
  if (status === "CLOSED") {
    return (
      <div className="p-3.5 border-t border-border/60 bg-muted/30 backdrop-blur-sm text-center">
        <p className="text-xs text-muted-foreground">{t("inbox.status_closed")}</p>
      </div>
    );
  }

  // 2. Bot is answering and we haven't taken over yet вЂ” block input and offer takeover
  if (status === "BOT_ACTIVE") {
    return (
      <div className="p-3 border-t border-border/60 bg-muted/30 backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 rounded-xl bg-card border border-border/70 shadow-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-foreground">
                {t("inbox.composer_bot_active_title")}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {t("inbox.composer_bot_active_desc")}
              </p>
            </div>
          </div>

          {onTakeover && (
            <Button
              size="sm"
              loading={isTakingOver}
              onClick={handleTakeoverClick}
              leftIcon={<UserCheck className="w-3.5 h-3.5" />}
              className="text-xs shrink-0 font-semibold"
            >
              {t("inbox.handoff_takeover")}
            </Button>
          )}
        </div>
      </div>
    );
  }

  // 3. Conversation is locked by another specialist
  if (isLockedExternally || isLockedByOther) {
    return (
      <div className="p-3 border-t border-border/60 bg-muted/40 backdrop-blur-sm">
        <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700">
          <Lock className="w-4 h-4 shrink-0 text-slate-500" />
          <p className="text-xs font-medium">{t("inbox.composer_locked_by_other")}</p>
        </div>
      </div>
    );
  }

  // 4. Escalated (MANAGER_INTERCEPTED), but not claimed by current user yet
  if (!isAssignedToMe) {
    return (
      <div className="p-3 border-t border-border/60 bg-muted/30 backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-900 shadow-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-lg bg-amber-100 text-amber-700 shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-amber-900">
                {t("inbox.composer_unassigned_title")}
              </p>
              <p className="text-[11px] text-amber-700/90 mt-0.5">
                {t("inbox.composer_unassigned_desc")}
              </p>
            </div>
          </div>

          {onTakeover && (
            <Button
              size="sm"
              loading={isTakingOver}
              onClick={handleTakeoverClick}
              leftIcon={<UserCheck className="w-3.5 h-3.5" />}
              className="text-xs shrink-0 border-amber-400 bg-amber-500 hover:bg-amber-600 text-white font-semibold"
            >
              {t("inbox.takeover_btn")}
            </Button>
          )}
        </div>
      </div>
    );
  }

  // 5. Assigned to current user вЂ” input is unlocked!
  const effectivelyDisabled = disabled || isSending;

  const handleSend = async () => {
    if (!content.trim() || isSending || effectivelyDisabled) return;

    const textToSend = content.trim();
    setContent("");
    setIsSending(true);

    try {
      await onSendMessage(textToSend);
      setIsLockedByOther(false);
    } catch (err: unknown) {
      const errCode = (err as { data?: { code?: string } })?.data?.code;
      if (errCode === "conversations.taken_over_by_other") {
        setIsLockedByOther(true);
        setContent(textToSend);
      } else {
        setContent(textToSend);
      }
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
      <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-semibold px-1">
        <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
        <span>
          {t("inbox.sender_prefix")} {senderLabel}
        </span>
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
          className="rounded-xl shrink-0 h-9 px-3.5 font-semibold"
        >
          {t("inbox.send_btn")}
        </Button>
      </div>
    </div>
  );
}

