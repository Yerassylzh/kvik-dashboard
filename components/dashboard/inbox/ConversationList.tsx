"use client";

import React from "react";
import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { InboxFilters } from "./InboxFilters";
import { ConversationListItem } from "./ConversationListItem";
import { StaggerContainer, StaggerItem } from "@/components/ui/motion/StaggerContainer";
import type { ConversationDto, ConversationStatus } from "@/lib/api/conversations";

interface ConversationListProps {
  conversations: ConversationDto[];
  activeId: string | null;
  onSelect: (id: string) => void;
  status: "ALL" | ConversationStatus;
  onStatusChange: (status: "ALL" | ConversationStatus) => void;
  search: string;
  onSearchChange: (search: string) => void;
  unreadCounts?: Record<string, number>;
  isLoading?: boolean;
}

export function ConversationList({
  conversations,
  activeId,
  onSelect,
  status,
  onStatusChange,
  search,
  onSearchChange,
  unreadCounts = {},
  isLoading,
}: ConversationListProps) {
  const t = useTranslations("dashboard");

  return (
    <div className="flex flex-col h-full bg-card/60 border border-border/60 rounded-2xl overflow-hidden shadow-xs">
      <div className="p-3 space-y-2.5 border-b border-border/50 bg-card/80">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t("inbox.search_placeholder")}
            className="w-full bg-muted/40 border border-border/60 rounded-xl pl-9 pr-4 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-all"
          />
        </div>

        <InboxFilters status={status} onStatusChange={onStatusChange} />
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {conversations.length === 0 && !isLoading && (
          <div className="text-center py-12 text-xs text-muted-foreground">
            {t("common.empty_data")}
          </div>
        )}

        <StaggerContainer className="space-y-1.5">
          {conversations.map((conv) => (
            <StaggerItem key={conv.id}>
              <ConversationListItem
                conversation={conv}
                isSelected={activeId === conv.id}
                onSelect={onSelect}
                unreadCount={unreadCounts[conv.id] || conv.unreadCount || 0}
              />
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </div>
  );
}
