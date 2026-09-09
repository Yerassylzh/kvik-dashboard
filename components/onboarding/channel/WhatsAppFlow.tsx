"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useTranslations } from "next-intl";
import { connectWhatsApp, getMetaConfig } from "@/lib/api/channels";
import { WhatsAppChannelMetadata, MetaConfig } from "@/types/channels";

interface WhatsAppFlowProps {
  onSuccess: (metadata: WhatsAppChannelMetadata) => void;
  onCancel: () => void;
}

type FlowState = "idle" | "loading-sdk" | "ready" | "waiting" | "connecting" | "success" | "error";

/**
 * Returns the callback URI for OAuth redirect.
 * If running on HTTP / localhost without HTTPS, returns "" (empty string)
 * so Meta Embedded Signup uses standard in-popup / JS SDK completion without
 * being blocked by HTTP redirect validation.
 */

const PUBLIC_URL = process.env.NEXT_PUBLIC_APP_URL;

const getCallbackUri = () => {
  if (typeof window === "undefined") return `${PUBLIC_URL}/onboarding/whatsapp-callback`;
  const isHttps = window.location.protocol === "https:";
  return isHttps ? `${window.location.origin}/onboarding/whatsapp-callback` : `${PUBLIC_URL}/onboarding/whatsapp-callback`;
};

export function WhatsAppFlow({ onSuccess, onCancel }: WhatsAppFlowProps) {
  const t = useTranslations("onboarding.channel");
  const [flowState, setFlowState] = useState<FlowState>("idle");
  const [error, setError] = useState<string | null>(null);
  const metaConfigRef = useRef<MetaConfig | null>(null);
  const popupRef = useRef<Window | null>(null);
  // Holds waba_id + phone_number_id captured from the WA_EMBEDDED_SIGNUP window message
  const embeddedDataRef = useRef<{ wabaId?: string; phoneNumberId?: string } | null>(null);

  // Load Meta config when flow is mounted
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setFlowState("loading-sdk");
      try {
        const config = await getMetaConfig();
        if (cancelled) return;
        metaConfigRef.current = config;
        setFlowState("ready");
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : t("whatsapp_flow_sdk_error"));
          setFlowState("error");
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Listen for WA_EMBEDDED_SIGNUP window messages and OAuth code callbacks via postMessage, BroadcastChannel, and localStorage
  useEffect(() => {
    let isProcessing = false;

    const onCodeReceived = async (code: string) => {
      if (!code || isProcessing) return;
      isProcessing = true;  
      try {
        popupRef.current?.close();
      } catch {
        // noop
      }
      await processConnection(code);
    };

    const handleMessage = async (event: MessageEvent) => {
      // Handle WA_EMBEDDED_SIGNUP postMessage from Meta
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
          // ignore non-JSON messages
        }
      }

      // Handle direct WHATSAPP_CONNECTED notification from callback page
      if (event.data?.type === "WHATSAPP_CONNECTED" && event.data?.channel) {
        console.log("[WhatsAppFlow] Channel already connected via callback page:", event.data.channel);
        setFlowState("success");
        onSuccess(event.data.channel.metadata as WhatsAppChannelMetadata);
        return;
      }

      // Handle OAuth redirect code from popup callback page
      if (
        event.data?.type === "WHATSAPP_OAUTH_CODE" ||
        event.data?.type === "OAUTH_CODE" ||
        event.data?.type === "INSTAGRAM_OAUTH_CODE"
      ) {
        const code = event.data?.code;
        if (code) {
          console.log("[WhatsAppFlow] Captured OAuth code from popup:", code);
          await onCodeReceived(code);
        }
      }
    };

    // BroadcastChannel listener
    let bc: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== "undefined") {
      bc = new BroadcastChannel("kvik_auth_channel");
      bc.onmessage = (event) => {
        if (event.data?.type === "WHATSAPP_CONNECTED" && event.data?.channel) {
          setFlowState("success");
          onSuccess(event.data.channel.metadata as WhatsAppChannelMetadata);
          return;
        }
        const code = event.data?.code;
        if (
          code &&
          (event.data?.type === "WHATSAPP_OAUTH_CODE" || event.data?.type === "OAUTH_CODE")
        ) {
          void onCodeReceived(code);
        }
      };
    }

    // Storage listener (for cross-tab / popups on same domain)
    const handleStorage = (event: StorageEvent) => {
      if (event.key === "kvik_oauth_payload" && event.newValue) {
        try {
          const parsed = JSON.parse(event.newValue);
          if (parsed?.type === "WHATSAPP_CONNECTED" && parsed?.channel) {
            localStorage.removeItem("kvik_oauth_payload");
            setFlowState("success");
            onSuccess(parsed.channel.metadata as WhatsAppChannelMetadata);
            return;
          }
          if (
            parsed?.code &&
            (parsed.type === "WHATSAPP_OAUTH_CODE" || parsed.type === "OAUTH_CODE")
          ) {
            localStorage.removeItem("kvik_oauth_payload");
            void onCodeReceived(parsed.code);
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const processConnection = async (code: string) => {
    const embedded = embeddedDataRef.current;
    const redirectUri = getCallbackUri();

    try {
      setFlowState("connecting");
      const res = await connectWhatsApp({
        code,
        wabaId: embedded?.wabaId,
        phoneNumberId: embedded?.phoneNumberId,
        redirectUri: redirectUri || undefined,
      });
      setFlowState("success");
      onSuccess(res.channel.metadata as WhatsAppChannelMetadata);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("whatsapp_flow_error"));
      setFlowState("error");
    }
  };

  const handleLaunchSignup = () => {
    if (!metaConfigRef.current) return;
    setFlowState("waiting");
    setError(null);

    try {
      const redirectUri = getCallbackUri();
      const params = new URLSearchParams({
        client_id: metaConfigRef.current.appId,
        config_id: metaConfigRef.current.whatsappConfigId,
        response_type: "code",
        override_default_response_type: "true",
      });

      if (redirectUri) {
        params.set("redirect_uri", redirectUri);
      }

      const rawVer = metaConfigRef.current.apiVersion || "v21.0";
      const verNum = parseInt(rawVer.replace(/^v/, ""), 10);
      const safeApiVersion = !isNaN(verNum) && verNum <= 22 ? rawVer : "v21.0";

      const oauthUrl = `https://www.facebook.com/${safeApiVersion}/dialog/oauth?${params.toString()}`;

      const popup = window.open(
        oauthUrl,
        "whatsapp-oauth",
        "width=600,height=700,top=100,left=200,scrollbars=yes"
      );
      popupRef.current = popup;

      const pollTimer = setInterval(() => {
        if (popup?.closed) {
          clearInterval(pollTimer);
          setFlowState((prev) => (prev === "waiting" ? "ready" : prev));
        }
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("whatsapp_flow_error"));
      setFlowState("error");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ type: "spring", stiffness: 300, damping: 28 }}
      className="mt-4 p-5 rounded-2xl bg-emerald-500/[0.04] border border-emerald-500/20"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <span className="text-xl">💬</span>
          <h5 className="font-bold text-foreground text-sm">
            {t("whatsapp_flow_title")}
          </h5>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="text-muted-foreground hover:text-foreground text-xs transition-colors cursor-pointer"
        >
          ✕
        </button>
      </div>

      {/* Description */}
      <p className="text-xs text-muted-foreground leading-relaxed mb-5">
        {t("whatsapp_flow_desc")}
      </p>

      {/* Requirements checklist */}
      <div className="space-y-2 mb-5">
        {(["whatsapp_flow_req1", "whatsapp_flow_req2"] as const).map((key) => (
          <div key={key} className="flex items-start gap-2">
            <span className="text-emerald-500 text-sm shrink-0 mt-0.5">✓</span>
            <p className="text-xs text-foreground leading-relaxed">
              {t(key)}
            </p>
          </div>
        ))}
      </div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 px-3 py-2 rounded-xl alert-destructive border text-xs"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* CTA */}
      <motion.button
        type="button"
        onClick={handleLaunchSignup}
        disabled={flowState === "loading-sdk" || flowState === "waiting" || flowState === "connecting"}
        whileTap={{ scale: 0.97 }}
        className="w-full py-2.5 text-xs font-bold rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
      >
        {(flowState === "loading-sdk" || flowState === "waiting" || flowState === "connecting") ? (
          <>
            <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            <span>
              {flowState === "loading-sdk"
                ? t("whatsapp_flow_loading")
                : flowState === "connecting"
                ? t("whatsapp_flow_connecting")
                : t("whatsapp_flow_popup_open")}
            </span>
          </>
        ) : (
          t("whatsapp_flow_btn")
        )}
      </motion.button>

      <p className="text-[10px] text-muted-foreground text-center mt-3">
        {t("whatsapp_flow_hint")}
      </p>
    </motion.div>
  );
}
