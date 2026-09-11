"use client";

import React, { useEffect } from "react";
import { useTranslations } from "next-intl";
import { FadeIn } from "@/components/ui/motion/FadeIn";
import { PageHeader } from "@/components/dashboard/shared/PageHeader";
import { ConversationList } from "./ConversationList";
import { ConversationThread } from "./ConversationThread";
import { useConversations } from "@/hooks/useConversations";
import { useInboxStore } from "@/store/inbox.store";

interface InboxPageProps {
  initialConversationId?: string;
}

export function InboxPage({ initialConversationId }: InboxPageProps) {
  const t = useTranslations("dashboard");
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
    <FadeIn direction="up" distance={20} duration={0.25} className="space-y-4 h-[calc(100vh-140px)] flex flex-col">
      <PageHeader
        title={t("inbox.title")}
        description={t("inbox.desc")}
      />

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 flex-1 min-h-0">
        <div className="md:col-span-4 lg:col-span-4 h-full">
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

        <div className="md:col-span-8 lg:col-span-8 h-full">
          <ConversationThread
            conversation={activeConversation}
            onStatusChange={() => refresh()}
          />
        </div>
      </div>
    </FadeIn>
  );
}
