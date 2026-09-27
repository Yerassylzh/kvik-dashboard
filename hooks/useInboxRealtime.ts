import { useEffect, useRef } from 'react';
import { io, type Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/auth.store';
import { useInboxStore } from '@/store/inbox.store';
import { useNotificationsStore } from '@/store/notifications.store';
import { useSWRConfig } from 'swr';
import { getSocketBaseUrl } from '@/lib/api/socketUrl';
import type {
  MessageDto,
  ConversationDto,
  ConversationStatus,
  PaginatedConversationsResponse,
  AssignedStaffDto,
} from '@/lib/api/conversations';
import type { NotificationDto } from '@/lib/api/notifications';
import { useMessageSound } from '@/hooks/useMessageSound';

export function useInboxRealtime(workspaceId?: string) {
  const socketRef = useRef<Socket | null>(null);
  const { accessToken } = useAuthStore();
  const { setUnreadCount, markTaken, markReleased } = useInboxStore();
  const { increment: incrementNotification, setLatestNotification } = useNotificationsStore();
  const { mutate } = useSWRConfig();
  const { playNotificationSound } = useMessageSound();

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

        // Play chime — user is not in this conversation
        playNotificationSound();
      }

      // Revalidate conversation list to update previews
      mutate((key) => Array.isArray(key) && key[0] === 'conversations');

      // If media attached, revalidate conversation media gallery
      if (payload.message?.metadata && (payload.message.metadata as { mediaUrl?: string })?.mediaUrl) {
        mutate((key) => Array.isArray(key) && key[0] === 'conversation/media' && key[1] === payload.conversationId);
      }
    });

    socket.on(
      'conversation.updated',
      (payload: {
        id: string;
        status?: ConversationStatus;
        lastMessageAt?: string;
        unreadCount?: number;
        takenOverByActorId?: string | null;
        assignedStaffId?: string | null;
        assignedStaff?: AssignedStaffDto | null;
      }) => {
        if (typeof payload.unreadCount === 'number') {
          setUnreadCount(payload.id, payload.unreadCount);
        }

        // Real-time lock reactivity: release or mark taken
        if (payload.status === 'BOT_ACTIVE' || payload.takenOverByActorId === null) {
          markReleased(payload.id);
        } else if (payload.takenOverByActorId) {
          markTaken(payload.id);
        }

        // Optimistically update conversation list caches and revalidate
        mutate(
          (key) => Array.isArray(key) && key[0] === 'conversations',
          (current: PaginatedConversationsResponse | undefined) => {
            if (!current?.data) return current;
            return {
              ...current,
              data: current.data.map((c) =>
                c.id === payload.id
                  ? {
                      ...c,
                      ...(payload.status ? { status: payload.status as ConversationStatus } : {}),
                      ...(payload.takenOverByActorId !== undefined
                        ? { takenOverByActorId: payload.takenOverByActorId }
                        : {}),
                      ...(payload.assignedStaffId !== undefined
                        ? { assignedStaffId: payload.assignedStaffId }
                        : {}),
                      ...(payload.assignedStaff !== undefined
                        ? { assignedStaff: payload.assignedStaff }
                        : {}),
                      ...(payload.lastMessageAt ? { lastMessageAt: payload.lastMessageAt } : {}),
                      ...(typeof payload.unreadCount === 'number'
                        ? { unreadCount: payload.unreadCount }
                        : {}),
                    }
                  : c
              ),
            };
          },
          { revalidate: true }
        );
      }
    );

    socket.on('conversation.new', (_newConv: ConversationDto) => {
      mutate((key) => Array.isArray(key) && key[0] === 'conversations');
    });

    // --- Escalation & Takeover Events ---

    socket.on('notification.new', (payload: NotificationDto) => {
      // 1. Bump global badge
      incrementNotification();
      setLatestNotification(payload);

      // 2. Prepend to notifications SWR cache
      mutate(
        (key) => Array.isArray(key) && key[0] === 'notifications',
        undefined,
        { revalidate: true }
      );

      // 3. Browser desktop notification
      if (typeof window !== 'undefined' && Notification.permission === 'granted') {
        new Notification(payload.title, {
          body: payload.body,
          icon: '/favicon.ico',
        });
      }
    });

    socket.on(
      'conversation.escalated',
      (_payload: { conversationId: string; triggerType: string; reason: string | null; triggeredAt: string }) => {
        // Revalidate conversation list so escalated item shows amber badge
        mutate((key) => Array.isArray(key) && key[0] === 'conversations');
      }
    );

    socket.on(
      'conversation.takeover',
      (payload: {
        conversationId: string;
        takenOverAt?: string;
        actorId?: string;
        assignedStaff?: AssignedStaffDto | null;
      }) => {
        // Mark as taken so TakeoverControl disables the button for other users
        markTaken(payload.conversationId);
        mutate(
          (key) => Array.isArray(key) && key[0] === 'conversations',
          (current: PaginatedConversationsResponse | undefined) => {
            if (!current?.data) return current;
            return {
              ...current,
              data: current.data.map((c) =>
                c.id === payload.conversationId
                  ? {
                      ...c,
                      status: 'MANAGER_INTERCEPTED' as ConversationStatus,
                      ...(payload.actorId !== undefined
                        ? { takenOverByActorId: payload.actorId }
                        : {}),
                      ...(payload.assignedStaff !== undefined
                        ? { assignedStaff: payload.assignedStaff }
                        : {}),
                    }
                  : c
              ),
            };
          },
          { revalidate: true }
        );
      }
    );

    socket.on(
      'conversation.takeover_released',
      (payload: { conversationId: string }) => {
        // Re-enable Take Over button for all users
        markReleased(payload.conversationId);
        mutate(
          (key) => Array.isArray(key) && key[0] === 'conversations',
          (current: PaginatedConversationsResponse | undefined) => {
            if (!current?.data) return current;
            return {
              ...current,
              data: current.data.map((c) =>
                c.id === payload.conversationId
                  ? {
                      ...c,
                      status: 'BOT_ACTIVE' as ConversationStatus,
                      takenOverByActorId: null,
                      assignedStaff: null,
                    }
                  : c
              ),
            };
          },
          { revalidate: true }
        );
      }
    );

    return () => {
      const currentWorkspaceId = workspaceId || useAuthStore.getState().user?.workspace?.id;
      if (currentWorkspaceId) {
        socket.emit('workspace.leave', { workspaceId: currentWorkspaceId });
      }
      socket.disconnect();
      socketRef.current = null;
    };
  }, [accessToken, workspaceId, setUnreadCount, markTaken, markReleased, incrementNotification, setLatestNotification, mutate, playNotificationSound]);

  return {
    socket: socketRef.current,
  };
}
