"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { io, type Socket } from "socket.io-client";
import { useAuthStore } from "@/store/auth.store";
import { getSocketBaseUrl } from "@/lib/api/socketUrl";
import type { DevMessage } from "@/lib/api/devMessaging";

interface UseDevMessagingSocketOptions {
  /** Workspace ID to join the workspace room. */
  workspaceId?: string;
  /** Called whenever a new message arrives for the active conversation. */
  onMessage: (conversationId: string, message: DevMessage) => void;
}

export interface UseDevMessagingSocketReturn {
  /** Whether the socket is currently connected. */
  isConnected: boolean;
  /** True while waiting for the bot reply after sending a message. */
  isWaitingForBot: boolean;
  /** Call right after simulate-inbound resolves so the hook watches for the BOT reply. */
  armBotWatcher: (conversationId: string) => void;
}

export function useDevMessagingSocket({
  workspaceId,
  onMessage,
}: UseDevMessagingSocketOptions): UseDevMessagingSocketReturn {
  const socketRef = useRef<Socket | null>(null);
  const { accessToken } = useAuthStore();
  const [isConnected, setIsConnected] = useState(false);
  const [isWaitingForBot, setIsWaitingForBot] = useState(false);

  // The conversationId we're watching for a BOT reply
  const watchedConvRef = useRef<string | null>(null);
  const watchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const armBotWatcher = useCallback((conversationId: string) => {
    watchedConvRef.current = conversationId;
    setIsWaitingForBot(true);
    if (watchTimeoutRef.current) clearTimeout(watchTimeoutRef.current);
    // Give up after 20s if no bot reply arrives
    watchTimeoutRef.current = setTimeout(() => {
      setIsWaitingForBot(false);
      watchedConvRef.current = null;
    }, 20_000);
  }, []);

  // Keep onMessage stable across renders without re-registering the socket listener
  const onMessageRef = useRef(onMessage);
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    if (!accessToken || typeof window === "undefined") return;

    const socketUrl = getSocketBaseUrl();

    const socket = io(`${socketUrl}/conversations`, {
      auth: { token: accessToken },
      transports: ["websocket", "polling"],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setIsConnected(true);
      const currentWorkspaceId = workspaceId || useAuthStore.getState().user?.workspace?.id;
      if (currentWorkspaceId) {
        socket.emit("workspace.join", { workspaceId: currentWorkspaceId });
      }
    });

    socket.on("disconnect", () => setIsConnected(false));

    const handleNewMessage = (payload: { conversationId: string; message: DevMessage }) => {
      onMessageRef.current(payload.conversationId, payload.message);

      // Disarm watcher when the BOT reply we were waiting for arrives
      if (
        payload.conversationId === watchedConvRef.current &&
        payload.message.role === "BOT"
      ) {
        setIsWaitingForBot(false);
        watchedConvRef.current = null;
        if (watchTimeoutRef.current) clearTimeout(watchTimeoutRef.current);
      }
    };

    socket.on("message.new", handleNewMessage);
    socket.on("message:new", handleNewMessage);

    return () => {
      if (watchTimeoutRef.current) clearTimeout(watchTimeoutRef.current);
      const currentWorkspaceId = workspaceId || useAuthStore.getState().user?.workspace?.id;
      if (currentWorkspaceId) {
        socket.emit("workspace.leave", { workspaceId: currentWorkspaceId });
      }
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [accessToken, workspaceId]);

  return { isConnected, isWaitingForBot, armBotWatcher };
}
