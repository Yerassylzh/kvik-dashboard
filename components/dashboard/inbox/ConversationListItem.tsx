"use client";

import React from "react";
import clsx from "clsx";
import { AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("dashboard");
  const leadName = conversation.lead?.name || t("inbox.role_user");
  const time = conversation.lastMessageAt
    ? new Date(conversation.lastMessageAt).toLocaleTimeString("ru-RU", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  const channelType = conversation.channelType;
  const channelColor = channelType ? channelColors[channelType] || "text-primary" : "";
  const isEscalated = conversation.status === "MANAGER_INTERCEPTED";

  return (
    <button
      type="button"
      onClick={() => onSelect(conversation.id)}
      className={clsx(
        "w-full text-left p-3 rounded-xl transition-all flex items-start gap-3 border cursor-pointer relative overflow-hidden",
        isSelected
          ? "bg-primary/10 border-primary/40 shadow-xs"
          : isEscalated
          ? "bg-amber-50/60 hover:bg-amber-50 border-amber-300/60 hover:border-amber-400/80"
          : "bg-card/60 hover:bg-card border-border/40 hover:border-border"
      )}
    >
      {/* Escalation left accent bar */}
      {isEscalated && !isSelected && (
        <span className="absolute inset-y-0 left-0 w-1 bg-amber-400 rounded-l-xl" />
      )}

      <div className="relative shrink-0">
        <EntityAvatar name={leadName} size="sm" />
        {channelType && (
          <span className={`absolute -bottom-1 -right-1 p-0.5 rounded-full bg-background ${channelColor}`}>
            <ChannelIcon type={channelType} className="w-3 h-3" />
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1 pl-1">
        <div className="flex items-center justify-between gap-2">
          <span className="font-semibold text-xs text-foreground truncate">{leadName}</span>
          <span className="text-[10px] text-muted-foreground font-mono shrink-0 tabular-nums">
            {time}
          </span>
        </div>

        {/* Escalation tag */}
        {isEscalated && (
          <div className="flex items-center gap-1 mt-0.5 mb-0.5">
            <AlertTriangle className="w-2.5 h-2.5 text-amber-500 shrink-0" />
            <span className="text-[10px] font-semibold text-amber-600">
              {t("inbox.escalated_tag")}
            </span>
          </div>
        )}

        <p className="text-xs text-muted-foreground truncate mt-0.5">
          {conversation.lastMessagePreview || t("inbox.no_messages")}
        </p>
      </div>

      {unreadCount > 0 && (
        <span className="h-4 min-w-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center shrink-0 tabular-nums">
          {unreadCount}
        </span>
      )}
    </button>
  );
}
