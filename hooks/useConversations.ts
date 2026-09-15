"use client";

import useSWR from 'swr';
import { useState, useCallback } from 'react';
import {
  conversationsApi,
  type ConversationStatus,
  type ChannelType,
  type ListConversationsParams,
} from '@/lib/api/conversations';
import { useInboxStore } from '@/store/inbox.store';

export function useConversations(initialParams?: ListConversationsParams) {
  const {
    activeConversationId,
    setActiveConversationId,
    filterStatus,
    setFilterStatus,
    filterChannel,
    setFilterChannel,
    searchQuery,
    setSearchQuery,
  } = useInboxStore();

  const [page, setPage] = useState(1);

  const queryParams: ListConversationsParams = {
    page,
    limit: 30,
    status: filterStatus !== 'ALL' ? filterStatus : undefined,
    channelType: filterChannel !== 'ALL' ? filterChannel : undefined,
    search: searchQuery || undefined,
    ...initialParams,
  };

  const {
    data,
    error,
    isLoading,
    mutate: mutateConversations,
  } = useSWR(['conversations', queryParams], () => conversationsApi.getConversations(queryParams), {
    revalidateOnFocus: true,
  });

  return {
    conversations: data?.data || [],
    total: data?.total || 0,
    page: data?.page || 1,
    limit: data?.limit || 30,
    activeConversationId,
    setActiveConversationId,
    filterStatus,
    setFilterStatus,
    filterChannel,
    setFilterChannel,
    searchQuery,
    setSearchQuery,
    setPage,
    isLoading,
    error,
    refresh: mutateConversations,
  };
}

export function useConversationMessages(conversationId: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    conversationId ? ['conversation/messages', conversationId] : null,
    () => (conversationId ? conversationsApi.getMessages(conversationId, { limit: 100 }) : null),
    {
      revalidateOnFocus: true,
    }
  );

  const sendMessage = useCallback(
    async (content: string) => {
      if (!conversationId || !content.trim()) return;

      const optimisticMsg = {
        id: `temp-${Date.now()}`,
        conversationId,
        role: 'MANAGER' as const,
        content: content.trim(),
        createdAt: new Date().toISOString(),
      };

      await mutate(
        (current) => {
          if (!current) return current;
          return {
            ...current,
            data: [...current.data, optimisticMsg],
            total: current.total + 1,
          };
        },
        { revalidate: false }
      );

      try {
        const sent = await conversationsApi.sendMessage(conversationId, content.trim());
        await mutate();
        return sent;
      } catch (err) {
        await mutate();
        throw err;
      }
    },
    [conversationId, mutate]
  );

  const updateStatus = useCallback(
    async (newStatus: ConversationStatus) => {
      if (!conversationId) return;
      await conversationsApi.updateStatus(conversationId, newStatus);
      await mutate();
    },
    [conversationId, mutate]
  );

  return {
    messages: data?.data || [],
    total: data?.total || 0,
    isLoading,
    error,
    sendMessage,
    updateStatus,
    refresh: mutate,
  };
}
