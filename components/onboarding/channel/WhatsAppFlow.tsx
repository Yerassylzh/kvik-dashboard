"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useTranslations } from "next-intl";
import { connectWhatsApp, getMetaConfig } from "@/lib/api/channels";
import { WhatsAppChannelMetadata, MetaConfig } from "@/types/channels";
import { useOAuthChannel } from "@/hooks/useOAuthChannel";

interface WhatsAppFlowProps {
  onSuccess: (metadata: WhatsAppChannelMetadata) => void;
  onCancel: () => void;
}

const PUBLIC_URL = process.env.NEXT_PUBLIC_APP_URL;

const getCallbackUri = () => {
  if (typeof window === "undefined") return `${PUBLIC_URL}/onboarding/whatsapp-callback`;
  const isHttps = window.location.protocol === "https:";
  return isHttps
    ? `${window.location.origin}/onboarding/whatsapp-callback`
    : `${PUBLIC_URL}/onboarding/whatsapp-callback`;
};

export function WhatsAppFlow({ onSuccess, onCancel }: WhatsAppFlowProps) {
  const t = useTranslations("onboarding.channel");
  const [configLoading, setConfigLoading] = useState(true);
  const metaConfigRef = useRef<MetaConfig | null>(null);

  const { flowState, setFlowState, error, setError, openOAuthPopup } =
    useOAuthChannel<WhatsAppChannelMetadata>({
      channelType: "WHATSAPP",
      onSuccess,
      connectApi: connectWhatsApp,
    });

  // Load Meta configuration on mount
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const config = await getMetaConfig();
        if (cancelled) return;
        metaConfigRef.current = config;
        setFlowState("ready");
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : t("whatsapp_flow_sdk_error")
          );
          setFlowState("error");
        }
      } finally {
        if (!cancelled) setConfigLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [setFlowState, setError, t]);

  const handleLaunchSignup = () => {
    if (!metaConfigRef.current) return;

    try {
      const redirectUri = getCallbackUri();
      const params = new URLSearchParams({
        client_id: metaConfigRef.current.appId || "",
        config_id: metaConfigRef.current.whatsappConfigId || "",
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
      openOAuthPopup(oauthUrl, "whatsapp-oauth");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("whatsapp_flow_error"));
      setFlowState("error");
    }
  };

  const isBusy =
    configLoading ||
    flowState === "waiting" ||
    flowState === "connecting";

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
