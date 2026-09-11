"use client";

import React from "react";
import clsx from "clsx";
import { EntityAvatar } from "@/components/dashboard/shared/EntityAvatar";
import { ChannelIcon } from "@/components/ui/channel-icon";
import type { ConversationDto } from "@/lib/api/conversations";

interface ConversationListItemProps {
  conversation: ConversationDto;
  isSelected: boolean;
  onSelect: (id: string) => void;
  unreadCount?: number;
}

const channelColors: Record<string, string> = {
  WHATSAPP: "text-emerald-500",
  INSTAGRAM: "text-pink-500",
  TELEGRAM: "text-sky-500",
};

export function ConversationListItem({
  conversation,
  isSelected,
  onSelect,
  unreadCount = 0,
}: ConversationListItemProps) {
  const leadName = conversation.lead?.name || "Клиент";
  const time = conversation.lastMessageAt
    ? new Date(conversation.lastMessageAt).toLocaleTimeString("ru-RU", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  const channelType = conversation.channelType;
  const channelColor = channelType ? channelColors[channelType] || "text-primary" : "";

  return (
    <button
      type="button"
      onClick={() => onSelect(conversation.id)}
      className={clsx(
        "w-full text-left p-3 rounded-xl transition-all flex items-start gap-3 border cursor-pointer",
        isSelected
          ? "bg-primary/10 border-primary/40 shadow-xs"
          : "bg-card/60 hover:bg-card border-border/40 hover:border-border"
      )}
    >
      <div className="relative shrink-0">
        <EntityAvatar name={leadName} size="sm" />
        {channelType && (
          <span className={`absolute -bottom-1 -right-1 p-0.5 rounded-full bg-background ${channelColor}`}>
            <ChannelIcon type={channelType} className="w-3 h-3" />
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="font-semibold text-xs text-foreground truncate">{leadName}</span>
          <span className="text-[10px] text-muted-foreground font-mono shrink-0">{time}</span>
        </div>

        <p className="text-xs text-muted-foreground truncate mt-1">
          {conversation.lastMessagePreview || "Нет сообщений"}
        </p>
      </div>

      {unreadCount > 0 && (
        <span className="h-4 min-w-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center shrink-0">
          {unreadCount}
        </span>
      )}
    </button>
  );
}
