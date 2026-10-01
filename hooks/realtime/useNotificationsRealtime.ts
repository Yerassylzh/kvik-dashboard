"use client";

import { useEffect, type MutableRefObject } from "react";
import type { Socket } from "socket.io-client";
import { useSWRConfig } from "swr";
import { useNotificationsStore } from "@/store/notifications.store";
import type { NotificationDto } from "@/lib/api/notifications";

export function useNotificationsRealtime(socketRef: MutableRefObject<Socket | null>) {
  const { increment: incrementNotification, setLatestNotification } =
    useNotificationsStore();
  const { mutate } = useSWRConfig();

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const handleNewNotification = (payload: NotificationDto) => {
      incrementNotification();
      setLatestNotification(payload);

      mutate(
        (key) => Array.isArray(key) && key[0] === "notifications",
        undefined,
        { revalidate: true }
      );

      if (typeof window !== "undefined" && Notification.permission === "granted") {
        new Notification(payload.title, {
          body: payload.body,
          icon: "/favicon.ico",
        });
      }
    };

    socket.on("notification.new", handleNewNotification);

    return () => {
      socket.off("notification.new", handleNewNotification);
    };
  }, [socketRef, mutate, incrementNotification, setLatestNotification]);
}
