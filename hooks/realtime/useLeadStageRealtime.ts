"use client";

import { useEffect, type MutableRefObject } from "react";
import type { Socket } from "socket.io-client";
import { useSWRConfig } from "swr";
import type { LeadDto, LeadStatus, PaginatedLeadsResponse } from "@/lib/api/leads";

export function useLeadStageRealtime(socketRef: MutableRefObject<Socket | null>) {
  const { mutate } = useSWRConfig();

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const handleLeadStageChanged = (payload: {
      leadId: string;
      newStatus: LeadStatus;
      metadata?: {
        bookingId?: string;
        startTime?: string;
        serviceName?: string;
      };
    }) => {
      if (!payload?.leadId) return;

      // 1. Mutate single lead detail cache
      mutate(
        ["lead", payload.leadId],
        (current: LeadDto | undefined) => {
          if (!current) return current;
          return {
            ...current,
            status: payload.newStatus,
            stageChangedAt: new Date().toISOString(),
          };
        },
        { revalidate: true }
      );

      // 2. Mutate leads list cache (Kanban & Table)
      mutate(
        (key) => Array.isArray(key) && key[0] === "leads",
        (current: PaginatedLeadsResponse | undefined) => {
          if (!current?.data) return current;
          return {
            ...current,
            data: current.data.map((lead) =>
              lead.id === payload.leadId ? { ...lead, status: payload.newStatus } : lead
            ),
          };
        },
        { revalidate: true }
      );

      // 3. Mutate lead counts & funnel
      mutate("leads/counts");
      mutate((key) => Array.isArray(key) && key[0] === "leads-funnel");

      // 4. Update conversations list containing this lead
      mutate((key) => Array.isArray(key) && key[0] === "conversations");

      // 5. If booking metadata attached, revalidate bookings & calendar
      if (payload.metadata?.bookingId) {
        mutate((key) => Array.isArray(key) && key[0] === "bookings");
        mutate("today-bookings");
        mutate((key) => Array.isArray(key) && key[0] === "calendar/bookings");
      }
    };

    socket.on("lead.stage_changed", handleLeadStageChanged);
    socket.on("lead:stage_changed", handleLeadStageChanged);

    return () => {
      socket.off("lead.stage_changed", handleLeadStageChanged);
      socket.off("lead:stage_changed", handleLeadStageChanged);
    };
  }, [socketRef, mutate]);
}
