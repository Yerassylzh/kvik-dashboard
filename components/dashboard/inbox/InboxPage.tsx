"use client";

import React, { useEffect } from "react";
import { FadeIn } from "@/components/ui/motion/FadeIn";
import { ConversationList } from "./ConversationList";
import { ConversationThread } from "./ConversationThread";
import { useConversations } from "@/hooks/useConversations";
import { useInboxStore } from "@/store/inbox.store";

interface InboxPageProps {
  initialConversationId?: string;
}

export function InboxPage({ initialConversationId }: InboxPageProps) {
  const {
    conversations,
    activeConversationId,
    setActiveConversationId,
    filterStatus,
    setFilterStatus,
    searchQuery,
    setSearchQuery,
    isLoading,
    refresh,
  } = useConversations();

  const { unreadCounts } = useInboxStore();

  useEffect(() => {
    if (initialConversationId) {
      setActiveConversationId(initialConversationId);
    } else if (conversations.length > 0 && !activeConversationId) {
      setActiveConversationId(conversations[0].id);
    }
  }, [initialConversationId, conversations, activeConversationId, setActiveConversationId]);

  const activeConversation = conversations.find((c) => c.id === activeConversationId);

  return (
    <FadeIn
      direction="up"
      distance={8}
      duration={0.2}
      className="h-[calc(100vh-80px)] flex flex-col overflow-hidden"
    >
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 flex-1 min-h-0 overflow-hidden">
        <div className="md:col-span-4 lg:col-span-4 h-full min-h-0">
          <ConversationList
            conversations={conversations}
            activeId={activeConversationId}
            onSelect={setActiveConversationId}
            status={filterStatus}
            onStatusChange={setFilterStatus}
            search={searchQuery}
            onSearchChange={setSearchQuery}
            unreadCounts={unreadCounts}
            isLoading={isLoading}
          />
        </div>

        <div className="md:col-span-8 lg:col-span-8 h-full min-h-0">
          <ConversationThread
            conversation={activeConversation}
            onStatusChange={() => refresh()}
            onRefreshConversations={refresh}
          />
        </div>
      </div>
    </FadeIn>
  );
}
