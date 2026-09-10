"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { ChannelType, Channel } from "@/types/channels";

export interface UseOAuthChannelOptions<TMetadata = unknown> {
  channelType: ChannelType;
  onSuccess: (metadata: TMetadata) => void;
  connectApi: (params: {
    code: string;
    wabaId?: string;
    phoneNumberId?: string;
    redirectUri?: string;
  }) => Promise<{ channel: Channel }>;
}

export type OAuthFlowState =
  | "idle"
  | "ready"
  | "waiting"
  | "connecting"
  | "success"
  | "error";

export function useOAuthChannel<TMetadata = unknown>({
  channelType,
  onSuccess,
  connectApi,
}: UseOAuthChannelOptions<TMetadata>) {
  const [flowState, setFlowState] = useState<OAuthFlowState>("ready");
  const [error, setError] = useState<string | null>(null);
  const popupRef = useRef<Window | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const embeddedDataRef = useRef<{ wabaId?: string; phoneNumberId?: string } | null>(null);
  const isProcessingRef = useRef(false);

  // Clear timers on unmount
  useEffect(() => {
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, []);

  const processConnection = useCallback(
    async (code: string, redirectUri?: string) => {
      if (!code || isProcessingRef.current) return;
      isProcessingRef.current = true;

      try {
        popupRef.current?.close();
      } catch {
        // noop
      }

      try {
        setFlowState("connecting");
        setError(null);
        const embedded = embeddedDataRef.current;
        const res = await connectApi({
          code,
          wabaId: embedded?.wabaId,
          phoneNumberId: embedded?.phoneNumberId,
          redirectUri,
        });

        setFlowState("success");
        onSuccess(res.channel.metadata as TMetadata);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Ошибка при подключении канала связи"
        );
        setFlowState("error");
      } finally {
        isProcessingRef.current = false;
      }
    },
    [connectApi, onSuccess]
  );

  // Listen across PostMessage, BroadcastChannel, and LocalStorage
  useEffect(() => {
    const handleConnectedDirectly = (channel: Channel) => {
      setFlowState("success");
      onSuccess(channel.metadata as TMetadata);
    };

    const handleMessage = async (event: MessageEvent) => {
      // 1. Meta Embedded Signup WABA event (postMessage from facebook.com)
      if (
        typeof event.origin === "string" &&
        (event.origin.includes("facebook.com") || event.origin.includes("meta.com"))
      ) {
        try {
          const data = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
          const wabaId =
            data?.data?.waba_id ||
            data?.waba_id ||
            data?.data?.wabaId ||
            data?.wabaId ||
            undefined;
          const phoneNumberId =
            data?.data?.phone_number_id ||
            data?.phone_number_id ||
            data?.data?.phoneNumberId ||
            data?.phoneNumberId ||
            undefined;

          if (wabaId || phoneNumberId) {
            embeddedDataRef.current = {
              wabaId: wabaId ? String(wabaId) : undefined,
              phoneNumberId: phoneNumberId ? String(phoneNumberId) : undefined,
            };
          }
        } catch {
          // ignore non-JSON
        }
      }

      // 2. Direct Channel Connected Notification from callback page
      if (
        (channelType === "WHATSAPP" && event.data?.type === "WHATSAPP_CONNECTED") ||
        (channelType === "INSTAGRAM" && event.data?.type === "INSTAGRAM_CONNECTED")
      ) {
        if (event.data?.channel) {
          handleConnectedDirectly(event.data.channel);
          return;
        }
      }

      // 3. OAuth code received from popup callback
      const isMatchingCodeType =
        (channelType === "WHATSAPP" && (event.data?.type === "WHATSAPP_OAUTH_CODE" || event.data?.type === "OAUTH_CODE")) ||
        (channelType === "INSTAGRAM" && (event.data?.type === "INSTAGRAM_OAUTH_CODE" || event.data?.type === "OAUTH_CODE"));

      if (isMatchingCodeType && event.data?.code) {
        await processConnection(event.data.code, event.data?.redirectUri);
      }
    };

    // BroadcastChannel listener
    let bc: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== "undefined") {
      bc = new BroadcastChannel("kvik_auth_channel");
      bc.onmessage = (event) => {
        if (
          (channelType === "WHATSAPP" && event.data?.type === "WHATSAPP_CONNECTED") ||
          (channelType === "INSTAGRAM" && event.data?.type === "INSTAGRAM_CONNECTED")
        ) {
          if (event.data?.channel) {
            handleConnectedDirectly(event.data.channel);
            return;
          }
        }

        const isMatchingCodeType =
          (channelType === "WHATSAPP" && (event.data?.type === "WHATSAPP_OAUTH_CODE" || event.data?.type === "OAUTH_CODE")) ||
          (channelType === "INSTAGRAM" && (event.data?.type === "INSTAGRAM_OAUTH_CODE" || event.data?.type === "OAUTH_CODE"));

        if (isMatchingCodeType && event.data?.code) {
          void processConnection(event.data.code, event.data?.redirectUri);
        }
      };
    }

    // Storage listener (for cross-tab / popups on same origin)
    const handleStorage = (event: StorageEvent) => {
      if (event.key === "kvik_oauth_payload" && event.newValue) {
        try {
          const parsed = JSON.parse(event.newValue);
          if (
            (channelType === "WHATSAPP" && parsed?.type === "WHATSAPP_CONNECTED") ||
            (channelType === "INSTAGRAM" && parsed?.type === "INSTAGRAM_CONNECTED")
          ) {
            if (parsed?.channel) {
              localStorage.removeItem("kvik_oauth_payload");
              handleConnectedDirectly(parsed.channel);
              return;
            }
          }

          const isMatchingCodeType =
            (channelType === "WHATSAPP" && (parsed?.type === "WHATSAPP_OAUTH_CODE" || parsed?.type === "OAUTH_CODE")) ||
            (channelType === "INSTAGRAM" && (parsed?.type === "INSTAGRAM_OAUTH_CODE" || parsed?.type === "OAUTH_CODE"));

          if (isMatchingCodeType && parsed?.code) {
            localStorage.removeItem("kvik_oauth_payload");
            void processConnection(parsed.code, parsed?.redirectUri);
          }
        } catch {
          // noop
        }
      }
    };

    window.addEventListener("message", handleMessage);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("message", handleMessage);
      window.removeEventListener("storage", handleStorage);
      bc?.close();
    };
  }, [channelType, onSuccess, processConnection]);

  const openOAuthPopup = useCallback(
    (url: string, popupName: string) => {
      setFlowState("waiting");
      setError(null);

      if (pollTimerRef.current) clearInterval(pollTimerRef.current);

      try {
        const popup = window.open(
          url,
          popupName,
          "width=600,height=700,top=100,left=200,scrollbars=yes"
        );
        popupRef.current = popup;

        pollTimerRef.current = setInterval(() => {
          if (popup?.closed) {
            if (pollTimerRef.current) clearInterval(pollTimerRef.current);
            setFlowState((prev) => (prev === "waiting" ? "ready" : prev));
          }
        }, 1000);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Не удалось открыть окно авторизации"
        );
        setFlowState("error");
      }
    },
    []
  );

  return {
    flowState,
    setFlowState,
    error,
    setError,
    openOAuthPopup,
    processConnection,
  };
}
