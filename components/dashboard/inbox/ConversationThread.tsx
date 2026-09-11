"use client";

import React, { useRef, useEffect } from "react";
import { MessageSquare, Phone, ExternalLink } from "lucide-react";
import { useTranslations } from "next-intl";
import { EntityAvatar } from "@/components/dashboard/shared/EntityAvatar";
import { HandoffToggle } from "./HandoffToggle";
import { MessageBubble } from "./MessageBubble";
import { ManagerComposer } from "./ManagerComposer";
import { useConversationMessages } from "@/hooks/useConversations";
import type { ConversationDto, ConversationStatus } from "@/lib/api/conversations";

interface ConversationThreadProps {
  conversation?: ConversationDto;
  onStatusChange?: (status: ConversationStatus) => void;
}

export function ConversationThread({
  conversation,
  onStatusChange,
}: ConversationThreadProps) {
  const t = useTranslations("dashboard");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { messages, isLoading, sendMessage, updateStatus } = useConversationMessages(
    conversation?.id || null
  );

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (!conversation) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-card/40 border border-border/60 rounded-2xl p-8 text-center text-muted-foreground">
        <MessageSquare className="w-12 h-12 mb-3 opacity-30 text-primary" />
        <p className="text-sm font-medium">{t("inbox.empty_thread")}</p>
      </div>
    );
  }

  const handleStatusToggle = (newStatus: ConversationStatus) => {
    updateStatus(newStatus);
    onStatusChange?.(newStatus);
  };

  const leadName = conversation.lead?.name || "Клиент";

  return (
    <div className="flex flex-col h-full bg-card/60 border border-border/60 rounded-2xl overflow-hidden shadow-xs">
      {/* Thread Header */}
      <div className="flex items-center justify-between p-3.5 px-4 border-b border-border/50 bg-card/80 backdrop-blur-sm">
        <div className="flex items-center gap-3 min-w-0">
          <EntityAvatar name={leadName} size="md" />
          <div className="min-w-0">
            <h3 className="font-bold text-sm text-foreground truncate">{leadName}</h3>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
              {conversation.lead?.phone && (
                <span className="font-mono">{conversation.lead.phone}</span>
              )}
              {conversation.channelType && (
                <span className="bg-muted px-2 py-0.2 rounded text-[11px] font-medium">
                  {conversation.channelType}
                </span>
              )}
            </div>
          </div>
        </div>

        <HandoffToggle
          status={conversation.status}
          onStatusChange={handleStatusToggle}
        />
      </div>

      {/* Messages Stream */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-1">
        {messages.length === 0 && !isLoading && (
          <div className="text-center py-16 text-xs text-muted-foreground">
            История сообщений пуста
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
      </div>

      {/* Composer */}
      <ManagerComposer onSendMessage={sendMessage} />
    </div>
  );
}
