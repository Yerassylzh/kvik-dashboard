"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useTranslations } from "next-intl";
import { connectWhatsApp, getMetaConfig } from "@/lib/api/channels";
import { WhatsAppChannelMetadata, FbLoginResponse, MetaConfig } from "@/types/channels";

interface WhatsAppFlowProps {
  onSuccess: (metadata: WhatsAppChannelMetadata) => void;
  onCancel: () => void;
}

type FlowState = "idle" | "loading-sdk" | "ready" | "waiting" | "connecting" | "success" | "error";

export function WhatsAppFlow({ onSuccess, onCancel }: WhatsAppFlowProps) {
  const t = useTranslations("onboarding.channel");
  const [flowState, setFlowState] = useState<FlowState>("idle");
  const [error, setError] = useState<string | null>(null);
  const metaConfigRef = useRef<MetaConfig | null>(null);
  // Holds waba_id + phone_number_id captured from the WA_EMBEDDED_SIGNUP window message
  const embeddedDataRef = useRef<{ wabaId: string; phoneNumberId: string } | null>(null);

  // Load Meta config and FB SDK when flow is mounted
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setFlowState("loading-sdk");
      try {
        const config = await getMetaConfig();
        if (cancelled) return;
        metaConfigRef.current = config;

        // Inject FB SDK if not already present
        if (!document.getElementById("facebook-jssdk")) {
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement("script");
            script.id = "facebook-jssdk";
            script.src = "https://connect.facebook.net/en_US/sdk.js";
            script.async = true;
            script.defer = true;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error("Failed to load Facebook SDK"));
            document.head.appendChild(script);
          });
        }

        if (cancelled) return;

        // Initialize FB SDK
        window.FB?.init({
          appId: config.appId,
          autoLogAppEvents: true,
          xfbml: true,
          version: config.apiVersion,
        });

        setFlowState("ready");
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : t("whatsapp_flow_sdk_error"));
          setFlowState("error");
        }
      }
    };

    load();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Listen for WA_EMBEDDED_SIGNUP window messages
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!event.origin.endsWith("facebook.com")) return;
      try {
        const data = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
        if (data?.type === "WA_EMBEDDED_SIGNUP" && data?.event === "FINISH") {
          embeddedDataRef.current = {
            wabaId: data.data?.waba_id ?? "",
            phoneNumberId: data.data?.phone_number_id ?? "",
          };
        }
      } catch {
        // ignore non-JSON messages
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const handleLaunchSignup = () => {
    if (!window.FB || !metaConfigRef.current) return;
    setFlowState("waiting");
    setError(null);

    window.FB.login(
      async (response: FbLoginResponse) => {
        if (!response.authResponse?.code) {
          // User cancelled the popup
          setFlowState("ready");
          return;
        }

        const code = response.authResponse.code;
        const embedded = embeddedDataRef.current;

        if (!embedded?.wabaId || !embedded?.phoneNumberId) {
          setError(t("whatsapp_flow_missing_data"));
          setFlowState("error");
          return;
        }

        try {
          setFlowState("connecting");
          const res = await connectWhatsApp({
            code,
            wabaId: embedded.wabaId,
            phoneNumberId: embedded.phoneNumberId,
          });
          setFlowState("success");
          onSuccess(res.channel.metadata as WhatsAppChannelMetadata);
        } catch (err) {
          setError(err instanceof Error ? err.message : t("whatsapp_flow_error"));
          setFlowState("error");
        }
      },
      {
        config_id: metaConfigRef.current.whatsappConfigId,
        response_type: "code",
        override_default_response_type: true,
        extras: { setup: {} },
      }
    );
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
