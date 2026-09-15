"use client";

import { useEffect, useRef } from 'react';
import { io, type Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/auth.store';
import { useInboxStore } from '@/store/inbox.store';
import { useSWRConfig } from 'swr';
import { getSocketBaseUrl } from '@/lib/api/socketUrl';
import type { MessageDto, ConversationDto } from '@/lib/api/conversations';

export function useInboxRealtime(workspaceId?: string) {
  const socketRef = useRef<Socket | null>(null);
  const { accessToken } = useAuthStore();
  const { setUnreadCount } = useInboxStore();
  const { mutate } = useSWRConfig();

  // Keep workspaceId synced if socket is already connected
  useEffect(() => {
    if (socketRef.current?.connected && workspaceId) {
      socketRef.current.emit('workspace.join', { workspaceId });
    }
  }, [workspaceId]);

  useEffect(() => {
    if (!accessToken || typeof window === 'undefined') return;

    const socketUrl = getSocketBaseUrl();
    const socket = io(`${socketUrl}/conversations`, {
      auth: { token: accessToken },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      const currentWorkspaceId = workspaceId || useAuthStore.getState().user?.workspace?.id;
      if (currentWorkspaceId) {
        socket.emit('workspace.join', { workspaceId: currentWorkspaceId });
      }
    });

    socket.on('message.new', (payload: { conversationId: string; message: MessageDto }) => {
      const currentActiveId = useInboxStore.getState().activeConversationId;

      // If the message belongs to the currently open conversation, append it
      if (payload.conversationId === currentActiveId) {
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
      const currentWorkspaceId = workspaceId || useAuthStore.getState().user?.workspace?.id;
      if (currentWorkspaceId) {
        socket.emit('workspace.leave', { workspaceId: currentWorkspaceId });
      }
      socket.disconnect();
      socketRef.current = null;
    };
  }, [accessToken, workspaceId, setUnreadCount, mutate]);

  return {
    socket: socketRef.current,
  };
}
