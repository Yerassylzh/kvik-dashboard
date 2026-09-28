"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useTranslations } from "next-intl";
import { connectWhatsApp, getMetaConfig } from "@/lib/api/channels";
import { loadMetaSdk } from "@/lib/meta-sdk";
import { WhatsAppChannelMetadata, MetaConfig, FbLoginResponse } from "@/types/channels";

interface WhatsAppFlowProps {
  onSuccess: (metadata: WhatsAppChannelMetadata) => void;
  onCancel: () => void;
}

interface WabaSessionData {
  waba_id?: string;
  phone_number_id?: string;
  business_id?: string;
  [key: string]: unknown;
}

type FlowState = "ready" | "waiting" | "connecting";

export function WhatsAppFlow({ onSuccess, onCancel }: WhatsAppFlowProps) {
  const t = useTranslations("onboarding.channel");
  const [configLoading, setConfigLoading] = useState(true);
  const [flowState, setFlowState] = useState<FlowState>("ready");
  const [error, setError] = useState<string | null>(null);

  const metaConfigRef = useRef<MetaConfig | null>(null);
  const wabaDataRef = useRef<WabaSessionData | null>(null);

  // 1. Fetch backend Meta config & initialize Meta JS SDK via singleton loader
  useEffect(() => {
    let cancelled = false;

    const initSdk = async () => {
      try {
        const config = await getMetaConfig();
        if (cancelled) return;
        metaConfigRef.current = config;

        const appId = config.appId;
        const apiVersion = config.apiVersion || "v22.0";

        if (!appId) {
          throw new Error("Meta App ID is not configured");
        }

        await loadMetaSdk({
          appId,
          apiVersion,
          autoLogAppEvents: true,
          xfbml: true,
        });

        if (!cancelled) {
          setFlowState("ready");
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : t("whatsapp_flow_sdk_error")
          );
        }
      } finally {
        if (!cancelled) {
          setConfigLoading(false);
        }
      }
    };

    void initSdk();
    return () => {
      cancelled = true;
    };
  }, [t]);

  // 2. Listen for WA_EMBEDDED_SIGNUP message events from Meta popup
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (
        !event.origin ||
        (event.origin !== "https://www.facebook.com" &&
          event.origin !== "https://web.facebook.com" &&
          !event.origin.endsWith(".facebook.com") &&
          !event.origin.endsWith(".meta.com"))
      ) {
        return;
      }

      try {
        const payload =
          typeof event.data === "string" ? JSON.parse(event.data) : event.data;

        if (payload?.type === "WA_EMBEDDED_SIGNUP") {
          const eventType = payload.event;
          if (
            eventType === "FINISH" ||
            eventType === "FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING" ||
            (typeof eventType === "string" && eventType.startsWith("FINISH")) ||
            payload.data
          ) {
            wabaDataRef.current = payload.data || {};
          } else if (eventType === "CANCEL") {
            setFlowState("ready");
          } else if (eventType === "ERROR") {
            setError(payload.data?.error_message || t("whatsapp_flow_error"));
            setFlowState("ready");
          }
        }
      } catch {
        // Non-JSON postMessage from 3rd-party frames, ignore
      }
    };

    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [t]);

  const handleAuthResponse = useCallback(
    async (response: FbLoginResponse) => {
      if (response?.authResponse?.code) {
        const authCode = response.authResponse.code;
        const captured = wabaDataRef.current;

        setFlowState("connecting");

        try {
          const res = await connectWhatsApp({
            code: authCode,
            wabaId:
              captured?.waba_id ||
              ((captured as Record<string, unknown> | null)?.wabaId as string | undefined),
            phoneNumberId:
              captured?.phone_number_id ||
              ((captured as Record<string, unknown> | null)?.phoneNumberId as string | undefined),
          });

          setFlowState("ready");
          onSuccess(res.channel.metadata as WhatsAppChannelMetadata);
        } catch (err) {
          setFlowState("ready");
          setError(
            err instanceof Error ? err.message : t("whatsapp_flow_error")
          );
        }
      } else {
        // User cancelled login or closed popup without completing
        setFlowState("ready");
      }
    },
    [onSuccess, t]
  );

  // 3. Trigger FB.login popup with Embedded Signup v4 config
  const handleLaunchSignup = useCallback(() => {
    if (typeof window !== "undefined" && window.location.protocol !== "https:" && window.location.hostname !== "localhost") {
      setError(t("whatsapp_flow_https_required"));
      setFlowState("ready");
      return;
    }

    if (!window.FB) {
      setError(t("whatsapp_flow_sdk_error"));
      return;
    }

    const configId = metaConfigRef.current?.whatsappConfigId;
    if (!configId) {
      setError(t("whatsapp_flow_missing_data"));
      return;
    }

    setError(null);
    setFlowState("waiting");

    try {
      // Must pass a standard synchronous Function callback to FB.login because Meta JS SDK strictly validates against [object Function]
      window.FB.login(
        function (response) {
          void handleAuthResponse(response);
        },
        {
          config_id: configId,
          response_type: "code",
          override_default_response_type: true,
          extras: {
            setup: {},
            featureType: "",
            sessionInfoVersion: "3",
          },
        }
      );
    } catch (err) {
      setFlowState("ready");
      setError(err instanceof Error ? err.message : t("whatsapp_flow_error"));
    }
  }, [handleAuthResponse, t]);

  const isBusy = configLoading || flowState === "waiting" || flowState === "connecting";

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
        disabled={isBusy}
        whileTap={{ scale: 0.97 }}
        className="w-full py-2.5 text-xs font-bold rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
      >
        {isBusy ? (
          <>
            <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            <span>
              {configLoading
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
