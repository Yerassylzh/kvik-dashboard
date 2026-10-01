"use client";

import { useEffect, useRef } from "react";
import { io, type Socket } from "socket.io-client";
import { useAuthStore } from "@/store/auth.store";
import { getSocketBaseUrl } from "@/lib/api/socketUrl";

export function useRealtimeSocket(workspaceId?: string) {
  const socketRef = useRef<Socket | null>(null);
  const { accessToken } = useAuthStore();

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
      const currentWorkspaceId =
        workspaceId || useAuthStore.getState().user?.workspace?.id;
      if (currentWorkspaceId) {
        socket.emit("workspace.join", { workspaceId: currentWorkspaceId });
      }
    });

    return () => {
      const currentWorkspaceId =
        workspaceId || useAuthStore.getState().user?.workspace?.id;
      if (currentWorkspaceId) {
        socket.emit("workspace.leave", { workspaceId: currentWorkspaceId });
      }
      socket.disconnect();
      socketRef.current = null;
    };
  }, [accessToken, workspaceId]);

  useEffect(() => {
    if (socketRef.current?.connected && workspaceId) {
      socketRef.current.emit("workspace.join", { workspaceId });
    }
  }, [workspaceId]);

  return socketRef;
}
