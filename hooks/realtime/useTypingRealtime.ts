"use client";

import { useEffect, type MutableRefObject } from "react";
import type { Socket } from "socket.io-client";
import { typingManager } from "@/store/typing.store";

export function useTypingRealtime(socketRef: MutableRefObject<Socket | null>) {
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const handleTyping = (payload: {
      conversationId: string;
      isTyping: boolean;
      role?: "bot" | "user";
    }) => {
      if (!payload?.conversationId) return;
      typingManager.setTyping(
        payload.conversationId,
        Boolean(payload.isTyping),
        payload.role || "bot"
      );
    };

    socket.on("conversation.typing", handleTyping);
    socket.on("conversation:typing", handleTyping);

    return () => {
      socket.off("conversation.typing", handleTyping);
      socket.off("conversation:typing", handleTyping);
    };
  }, [socketRef]);
}
