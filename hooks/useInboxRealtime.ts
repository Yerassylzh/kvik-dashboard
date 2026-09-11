"use client";

import { useEffect, useRef } from 'react';
import { io, type Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/auth.store';
import { useInboxStore } from '@/store/inbox.store';
import { useSWRConfig } from 'swr';
import type { MessageDto, ConversationDto } from '@/lib/api/conversations';

export function useInboxRealtime(workspaceId?: string) {
  const socketRef = useRef<Socket | null>(null);
  const { accessToken } = useAuthStore();
  const { setUnreadCount, activeConversationId } = useInboxStore();
  const { mutate } = useSWRConfig();

  useEffect(() => {
    if (!accessToken || typeof window === 'undefined') return;

    const socketUrl = process.env.NEXT_PUBLIC_API_URL || window.location.origin;
    const socket = io(`${socketUrl}/conversations`, {
      auth: { token: accessToken },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      if (workspaceId) {
        socket.emit('workspace.join', { workspaceId });
      }
    });

    socket.on('message.new', (payload: { conversationId: string; message: MessageDto }) => {
      // If the message belongs to the currently open conversation, append it
      if (payload.conversationId === activeConversationId) {
        mutate(
          ['conversation/messages', payload.conversationId],
          (current: { data: MessageDto[]; total: number } | undefined) => {
            if (!current) return current;
            const exists = current.data.some((m) => m.id === payload.message.id);
            if (exists) return current;
            return {
              ...current,
              data: [...current.data, payload.message],
              total: current.total + 1,
            };
          },
          false
        );
      } else {
        // Increment unread count for that conversation
        const state = useInboxStore.getState();
        const prev = state.unreadCounts[payload.conversationId] || 0;
        setUnreadCount(payload.conversationId, prev + 1);
      }

      // Revalidate conversation list to update previews
      mutate((key) => Array.isArray(key) && key[0] === 'conversations');
    });

    socket.on('conversation.updated', (payload: { id: string; status: string; lastMessageAt: string; unreadCount: number }) => {
      setUnreadCount(payload.id, payload.unreadCount);
      mutate((key) => Array.isArray(key) && key[0] === 'conversations');
    });

    socket.on('conversation.new', (newConv: ConversationDto) => {
      mutate((key) => Array.isArray(key) && key[0] === 'conversations');
    });

    return () => {
      if (workspaceId) {
        socket.emit('workspace.leave', { workspaceId });
      }
      socket.disconnect();
    };
  }, [accessToken, workspaceId, activeConversationId, setUnreadCount, mutate]);

  return {
    socket: socketRef.current,
  };
}
