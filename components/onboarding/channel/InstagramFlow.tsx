"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useTranslations } from "next-intl";
import { connectInstagram, getMetaConfig } from "@/lib/api/channels";
import { InstagramChannelMetadata } from "@/types/channels";

interface InstagramFlowProps {
  onSuccess: (metadata: InstagramChannelMetadata) => void;
  onCancel: () => void;
}

type FlowState = "idle" | "ready" | "waiting" | "connecting" | "success" | "error";

/** URL of the callback page that reads ?code= and postMessages it back */
const getCallbackUri = () =>
  `${window.location.origin}/onboarding/instagram-callback`;

export function InstagramFlow({ onSuccess, onCancel }: InstagramFlowProps) {
  const t = useTranslations("onboarding.channel");
  const [flowState, setFlowState] = useState<FlowState>("ready");
  const [error, setError] = useState<string | null>(null);
  const popupRef = useRef<Window | null>(null);
  const metaScopesRef = useRef<string>("instagram_basic,instagram_manage_messages,pages_show_list,pages_manage_metadata");
  const appIdRef = useRef<string>("");

  // Load Meta config for appId & scopes
  useEffect(() => {
    getMetaConfig()
      .then((cfg) => {
        appIdRef.current = cfg.appId;
        metaScopesRef.current = cfg.instagramScopes.join(",");
      })
      .catch(() => {
        // Non-fatal — scopes fall back to defaults above
      });
  }, []);

  // Listen for the code postMessage from the callback popup
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type !== "INSTAGRAM_OAUTH_CODE") return;

      const code: string = event.data.code;
      if (!code) return;

      // Close popup
      try { popupRef.current?.close(); } catch { /* noop */ }

      try {
        setFlowState("connecting");
        const res = await connectInstagram({
          code,
          redirectUri: getCallbackUri(),
        });
        setFlowState("success");
        onSuccess(res.channel.metadata as InstagramChannelMetadata);
      } catch (err) {
        setError(err instanceof Error ? err.message : t("instagram_flow_error"));
        setFlowState("error");
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLaunchOAuth = () => {
    if (!appIdRef.current) return;
    setFlowState("waiting");
    setError(null);

    const redirectUri = getCallbackUri();
    const params = new URLSearchParams({
      client_id: appIdRef.current,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: metaScopesRef.current,
    });

    const oauthUrl = `https://www.facebook.com/dialog/oauth?${params.toString()}`;
    const popup = window.open(
      oauthUrl,
      "instagram-oauth",
      "width=600,height=700,top=100,left=200,scrollbars=yes"
    );
    popupRef.current = popup;

    // Poll every 1 second to detect if user manually closed the popup
    const pollTimer = setInterval(() => {
      if (popup?.closed) {
        clearInterval(pollTimer);
        // Only reset if we're still "waiting" (i.e. no code received)
        setFlowState((prev) => (prev === "waiting" ? "ready" : prev));
      }
    }, 1000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ type: "spring", stiffness: 300, damping: 28 }}
      className="mt-4 p-5 rounded-2xl bg-purple-500/[0.04] border border-purple-500/20"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <span className="text-xl">📸</span>
          <h5 className="font-bold text-foreground text-sm">
            {t("instagram_flow_title")}
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

      {/* Prerequisites */}
      <div className="mb-5 p-3 rounded-xl bg-amber-500/[0.07] border border-amber-500/20">
        <p className="text-[11px] font-bold text-amber-700 dark:text-amber-400 mb-2">
          {t("instagram_flow_prereq_title")}
        </p>
        <div className="space-y-1.5">
          {(["instagram_flow_prereq1", "instagram_flow_prereq2"] as const).map((key) => (
            <div key={key} className="flex items-start gap-2">
              <span className="text-amber-500 text-xs shrink-0 mt-0.5">⚠</span>
              <p className="text-xs text-foreground leading-relaxed">{t(key)}</p>
            </div>
          ))}
        </div>
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
        onClick={handleLaunchOAuth}
        disabled={flowState === "waiting" || flowState === "connecting"}
        whileTap={{ scale: 0.97 }}
        className="w-full py-2.5 text-xs font-bold rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2 shadow-md"
      >
        {(flowState === "waiting" || flowState === "connecting") ? (
          <>
            <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            <span>
              {flowState === "connecting"
                ? t("instagram_flow_connecting")
                : t("instagram_flow_popup_open")}
            </span>
          </>
        ) : (
          t("instagram_flow_btn")
        )}
      </motion.button>

      <p className="text-[10px] text-muted-foreground text-center mt-3">
        {t("instagram_flow_hint")}
      </p>
    </motion.div>
  );
}
