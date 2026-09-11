"use client";

import React, { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import {
  MessageSquare,
  RefreshCw,
  RotateCcw,
  Copy,
  Check,
  Search,
  Sparkles,
  Phone,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { StatusBadge, type ConversationStatus } from "@/components/dashboard/shared/StatusBadge";
import { DevMessageBubble } from "./DevMessageBubble";
import type {
  ConversationMessagesResponse,
  ChannelType,
} from "@/lib/api/devMessaging";

const CHANNEL_BADGES: Record<ChannelType, { label: string; bg: string; text: string; border: string }> = {
  WHATSAPP: {
    label: "WhatsApp",
    bg: "bg-emerald-500/10",
    text: "text-emerald-700 dark:text-emerald-400",
    border: "border-emerald-500/30",
  },
  INSTAGRAM: {
    label: "Instagram",
    bg: "bg-pink-500/10",
    text: "text-pink-700 dark:text-pink-400",
    border: "border-pink-500/30",
  },
  TELEGRAM: {
    label: "Telegram",
    bg: "bg-blue-500/10",
    text: "text-blue-700 dark:text-blue-400",
    border: "border-blue-500/30",
  },
};

interface DevChatInspectorProps {
  conversationData: ConversationMessagesResponse | null;
  isLoading: boolean;
  isPolling: boolean;
  onRefresh: () => void;
  onResetConversation: (conversationId: string) => Promise<void>;
  onLookupConversation: (conversationId: string) => void;
  isResetting: boolean;
}

export function DevChatInspector({
  conversationData,
  isLoading,
  isPolling,
  onRefresh,
  onResetConversation,
  onLookupConversation,
  isResetting,
}: DevChatInspectorProps) {
  const t = useTranslations("dashboard");
  const [copied, setCopied] = useState(false);
  const [lookupId, setLookupId] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversationData?.messages]);

  const handleCopyId = (id: string) => {
    if (!id) return;
    navigator.clipboard.writeText(id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLookupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupId.trim()) return;
    onLookupConversation(lookupId.trim());
  };

  const channelMeta = conversationData?.channelType
    ? CHANNEL_BADGES[conversationData.channelType]
    : null;

  return (
    <div className="flex flex-col h-[580px] rounded-2xl border border-border/70 bg-card overflow-hidden shadow-xs">
      {/* Top bar with conversation info & actions */}
      <div className="p-3.5 sm:p-4 border-b border-border/60 bg-muted/20 flex flex-col gap-3">
        {/* Header Title & Status */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-xs sm:text-sm text-foreground truncate">
                  {conversationData?.lead?.name || t("dev_messaging.history_title")}
                </h3>
                {channelMeta && (
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${channelMeta.bg} ${channelMeta.text} ${channelMeta.border}`}
                  >
                    {channelMeta.label}
                  </span>
                )}
                {conversationData?.status && (
                  <StatusBadge
                    status={conversationData.status as ConversationStatus}
                    type="conversation"
                  />
                )}
              </div>
              {conversationData?.lead?.phone && (
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5">
                  <Phone className="w-3 h-3 text-muted-foreground/70" />
                  <span className="font-mono">{conversationData.lead.phone}</span>
                </div>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            {isPolling && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-accent-ai/10 text-accent-ai text-[10px] font-medium animate-pulse">
                <Sparkles className="w-3 h-3" />
                <span className="hidden sm:inline">{t("dev_messaging.auto_poll_active")}</span>
              </div>
            )}

            {conversationData && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onResetConversation(conversationData.conversationId)}
                disabled={isResetting || isLoading}
                title={t("dev_messaging.reset_title")}
                className="h-8 text-xs gap-1.5"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? "animate-spin" : ""}`} />
                <span className="hidden md:inline">{t("dev_messaging.reset_btn")}</span>
              </Button>
            )}

            <Button
              size="sm"
              variant="outline"
              onClick={onRefresh}
              disabled={isLoading}
              title={t("dev_messaging.refresh_history")}
              className="h-8 w-8 p-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        {/* Conversation ID and Lookup Bar */}
        <div className="flex items-center justify-between gap-2 text-xs pt-2 border-t border-border/40 flex-wrap sm:flex-nowrap">
          {conversationData?.conversationId ? (
            <div className="flex items-center gap-1.5 text-muted-foreground min-w-0">
              <span className="text-[11px] shrink-0 font-medium">ID:</span>
              <span className="font-mono text-[11px] text-foreground truncate max-w-[160px] sm:max-w-[220px]">
                {conversationData.conversationId}
              </span>
              <button
                type="button"
                onClick={() => handleCopyId(conversationData.conversationId)}
                className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                title={t("dev_messaging.copy_id")}
              >
                {copied ? (
                  <Check className="w-3 h-3 text-emerald-500" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </button>
            </div>
          ) : (
            <span className="text-[11px] text-muted-foreground">
              {t("dev_messaging.history_desc")}
            </span>
          )}

          {/* Quick ID lookup form */}
          <form onSubmit={handleLookupSubmit} className="flex items-center gap-1.5 ml-auto w-full sm:w-auto">
            <Input
              type="text"
              value={lookupId}
              onChange={(e) => setLookupId(e.target.value)}
              placeholder={t("dev_messaging.lookup_placeholder")}
              className="h-7 text-[11px] w-full sm:w-44 font-mono px-2 py-1"
            />
            <Button
              type="submit"
              size="sm"
              variant="ghost"
              disabled={!lookupId.trim()}
              className="h-7 px-2 text-[11px] gap-1 shrink-0"
            >
              <Search className="w-3 h-3" />
              <span>{t("dev_messaging.lookup_btn")}</span>
            </Button>
          </form>
        </div>
      </div>

      {/* Messages stream area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-background/50"
      >
        {isLoading && !conversationData ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-2">
            <RefreshCw className="w-5 h-5 animate-spin text-primary" />
            <p className="text-xs">{t("dev_messaging.fetching_history")}</p>
          </div>
        ) : !conversationData || conversationData.messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
            <div className="w-12 h-12 rounded-2xl bg-muted/40 border border-border/50 flex items-center justify-center mb-3">
              <MessageSquare className="w-6 h-6 text-muted-foreground/60" />
            </div>
            <p className="text-xs max-w-[260px] leading-relaxed">
              {t("dev_messaging.no_conversation")}
            </p>
          </div>
        ) : (
          conversationData.messages.map((msg) => (
            <DevMessageBubble key={msg.id} message={msg} />
          ))
        )}
      </div>

      {/* Footer info bar */}
      {conversationData && (
        <div className="px-3.5 py-2 border-t border-border/50 bg-muted/10 text-[11px] text-muted-foreground flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <User className="w-3 h-3 text-muted-foreground/70" />
            <span>
              {conversationData.lead?.name || t("dev_messaging.lead_label")}: {conversationData.messages.length} сообщений
            </span>
          </div>
          <Badge variant="muted" className="text-[10px] font-mono">
            {conversationData.channelType}
          </Badge>
        </div>
      )}
    </div>
  );
}
