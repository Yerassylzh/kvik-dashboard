"use client";

import { useEffect, type MutableRefObject } from "react";
import type { Socket } from "socket.io-client";
import { useSWRConfig } from "swr";
import { useInboxStore } from "@/store/inbox.store";
import { typingManager } from "@/store/typing.store";
import { useMessageSound } from "@/hooks/useMessageSound";
import type { MessageDto } from "@/lib/api/conversations";

export function useMessagesRealtime(socketRef: MutableRefObject<Socket | null>) {
  const { setUnreadCount } = useInboxStore();
  const { mutate } = useSWRConfig();
  const { playNotificationSound } = useMessageSound();

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const handleNewMessage = (payload: {
      conversationId: string;
      message: MessageDto;
    }) => {
      if (!payload?.conversationId || !payload?.message) return;

      // Disarm typing indicator when a message arrives
      typingManager.clearTyping(payload.conversationId);

      const currentActiveId = useInboxStore.getState().activeConversationId;

      if (payload.conversationId === currentActiveId) {
        mutate(
          ["conversation/messages", payload.conversationId],
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
        const state = useInboxStore.getState();
        const prev = state.unreadCounts?.[payload.conversationId] || 0;
        setUnreadCount(payload.conversationId, prev + 1);
        playNotificationSound();
      }

      // Revalidate conversation list to update previews
      mutate((key) => Array.isArray(key) && key[0] === "conversations");

      if (
        payload.message?.metadata &&
        (payload.message.metadata as { mediaUrl?: string })?.mediaUrl
      ) {
        mutate(
          (key) =>
            Array.isArray(key) &&
            key[0] === "conversation/media" &&
            key[1] === payload.conversationId
        );
      }
    };

    socket.on("message.new", handleNewMessage);
    socket.on("message:new", handleNewMessage);

    return () => {
      socket.off("message.new", handleNewMessage);
      socket.off("message:new", handleNewMessage);
    };
  }, [socketRef, mutate, playNotificationSound, setUnreadCount]);
}
