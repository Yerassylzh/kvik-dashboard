"use client";

import { useRealtimeSocket } from "./realtime/useRealtimeSocket";
import { useTypingRealtime } from "./realtime/useTypingRealtime";
import { useMessagesRealtime } from "./realtime/useMessagesRealtime";
import { useLeadStageRealtime } from "./realtime/useLeadStageRealtime";
import { useConversationLocksRealtime } from "./realtime/useConversationLocksRealtime";
import { useNotificationsRealtime } from "./realtime/useNotificationsRealtime";

/**
 * Top-level real-time listener composed of modular sub-hooks.
 * Safely initializes WebSocket connection and registers domain-specific listeners.
 */
export function useInboxRealtime(workspaceId?: string) {
  const socketRef = useRealtimeSocket(workspaceId);

  useTypingRealtime(socketRef);
  useMessagesRealtime(socketRef);
  useLeadStageRealtime(socketRef);
  useConversationLocksRealtime(socketRef);
  useNotificationsRealtime(socketRef);

  return {
    getSocket: () => socketRef.current,
  };
}
