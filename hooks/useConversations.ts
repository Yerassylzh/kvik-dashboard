"use client";

import useSWR from 'swr';
import { useState, useCallback } from 'react';
import {
  conversationsApi,
  type ConversationStatus,
  type ListConversationsParams,
  type SendManagerMessageDto,
  type MessageDto,
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
    revalidateOnReconnect: true,
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
    () => (conversationId ? conversationsApi.getMessages(conversationId, { limit: 50 }) : null),
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  );

  const sendMessage = useCallback(
    async (payload: string | SendManagerMessageDto) => {
      if (!conversationId) return;

      const isString = typeof payload === 'string';
      const content = isString ? payload.trim() : (payload.content?.trim() || '');
      const hasMedia = !isString && !!payload.mediaUrl;

      if (!content && !hasMedia) return;

      const optimisticMsg: MessageDto = {
        id: `temp-${Date.now()}`,
        conversationId,
        role: 'MANAGER' as const,
        content: content || (payload as SendManagerMessageDto).fileName || '',
        metadata: hasMedia
          ? {
              mediaType: (payload as SendManagerMessageDto).mediaType,
              mediaUrl: (payload as SendManagerMessageDto).mediaUrl,
              fileName: (payload as SendManagerMessageDto).fileName,
              mimeType: (payload as SendManagerMessageDto).mimeType,
              fileSize: (payload as SendManagerMessageDto).fileSize,
              durationSeconds: (payload as SendManagerMessageDto).durationSeconds ?? undefined,
              isVoice: (payload as SendManagerMessageDto).mediaType === 'AUDIO',
            }
          : null,
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
        const sent = await conversationsApi.sendMessage(conversationId, payload);
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
