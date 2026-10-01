"use client";

import { useEffect, type MutableRefObject } from "react";
import type { Socket } from "socket.io-client";
import { useSWRConfig } from "swr";
import { useInboxStore } from "@/store/inbox.store";
import { typingManager } from "@/store/typing.store";
import type {
  ConversationStatus,
  PaginatedConversationsResponse,
  AssignedStaffDto,
} from "@/lib/api/conversations";

export function useConversationLocksRealtime(socketRef: MutableRefObject<Socket | null>) {
  const { setUnreadCount, markTaken, markReleased } = useInboxStore();
  const { mutate } = useSWRConfig();

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const handleConversationUpdated = (payload: {
      id: string;
      status?: ConversationStatus;
      lastMessageAt?: string;
      unreadCount?: number;
      takenOverByActorId?: string | null;
      assignedStaffId?: string | null;
      assignedStaff?: AssignedStaffDto | null;
    }) => {
      if (!payload?.id) return;

      if (typeof payload.unreadCount === "number") {
        setUnreadCount(payload.id, payload.unreadCount);
      }

      if (payload.status === "BOT_ACTIVE" || payload.takenOverByActorId === null) {
        markReleased(payload.id);
      } else if (payload.takenOverByActorId || payload.status === "MANAGER_INTERCEPTED") {
        markTaken(payload.id);
        typingManager.clearTyping(payload.id);
      }

      mutate(
        (key) => Array.isArray(key) && key[0] === "conversations",
        (current: PaginatedConversationsResponse | undefined) => {
          if (!current?.data) return current;
          return {
            ...current,
            data: current.data.map((c) =>
              c.id === payload.id
                ? {
                    ...c,
                    ...(payload.status ? { status: payload.status as ConversationStatus } : {}),
                    ...(payload.takenOverByActorId !== undefined ? { takenOverByActorId: payload.takenOverByActorId } : {}),
                    ...(payload.assignedStaffId !== undefined ? { assignedStaffId: payload.assignedStaffId } : {}),
                    ...(payload.assignedStaff !== undefined ? { assignedStaff: payload.assignedStaff } : {}),
                    ...(payload.lastMessageAt ? { lastMessageAt: payload.lastMessageAt } : {}),
                    ...(typeof payload.unreadCount === "number" ? { unreadCount: payload.unreadCount } : {}),
                  }
                : c
            ),
          };
        },
        { revalidate: true }
      );
    };

    const handleNewConv = () => {
      mutate((key) => Array.isArray(key) && key[0] === "conversations");
    };

    const handleEscalated = () => {
      mutate((key) => Array.isArray(key) && key[0] === "conversations");
    };

    const handleTakeover = (payload: {
      conversationId: string;
      takenOverAt?: string;
      actorId?: string;
      assignedStaff?: AssignedStaffDto | null;
    }) => {
      markTaken(payload.conversationId);
      typingManager.clearTyping(payload.conversationId);
      mutate(
        (key) => Array.isArray(key) && key[0] === "conversations",
        (current: PaginatedConversationsResponse | undefined) => {
          if (!current?.data) return current;
          return {
            ...current,
            data: current.data.map((c) =>
              c.id === payload.conversationId
                ? {
                    ...c,
                    status: "MANAGER_INTERCEPTED" as ConversationStatus,
                    ...(payload.actorId !== undefined ? { takenOverByActorId: payload.actorId } : {}),
                    ...(payload.assignedStaff !== undefined ? { assignedStaff: payload.assignedStaff } : {}),
                  }
                : c
            ),
          };
        },
        { revalidate: true }
      );
    };

    const handleTakeoverReleased = (payload: { conversationId: string }) => {
      markReleased(payload.conversationId);
      mutate(
        (key) => Array.isArray(key) && key[0] === "conversations",
        (current: PaginatedConversationsResponse | undefined) => {
          if (!current?.data) return current;
          return {
            ...current,
            data: current.data.map((c) =>
              c.id === payload.conversationId
                ? {
                    ...c,
                    status: "BOT_ACTIVE" as ConversationStatus,
                    takenOverByActorId: null,
                    assignedStaff: null,
                  }
                : c
            ),
          };
        },
        { revalidate: true }
      );
    };

    socket.on("conversation.updated", handleConversationUpdated);
    socket.on("conversation:updated", handleConversationUpdated);
    socket.on("conversation.new", handleNewConv);
    socket.on("conversation:new", handleNewConv);
    socket.on("conversation.escalated", handleEscalated);
    socket.on("conversation.takeover", handleTakeover);
    socket.on("conversation.takeover_released", handleTakeoverReleased);

    return () => {
      socket.off("conversation.updated", handleConversationUpdated);
      socket.off("conversation:updated", handleConversationUpdated);
      socket.off("conversation.new", handleNewConv);
      socket.off("conversation:new", handleNewConv);
      socket.off("conversation.escalated", handleEscalated);
      socket.off("conversation.takeover", handleTakeover);
      socket.off("conversation.takeover_released", handleTakeoverReleased);
    };
  }, [socketRef, mutate, markTaken, markReleased, setUnreadCount]);
}
