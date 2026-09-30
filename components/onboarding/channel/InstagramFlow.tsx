"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useTranslations } from "next-intl";
import { connectInstagram, getMetaConfig } from "@/lib/api/channels";
import { InstagramChannelMetadata, MetaConfig } from "@/types/channels";
import { useOAuthChannel } from "@/hooks/useOAuthChannel";

interface InstagramFlowProps {
  onSuccess: (metadata: InstagramChannelMetadata) => void;
  onCancel: () => void;
}

const getCallbackUri = () => {
  if (typeof window === "undefined") {
    return `${process.env.NEXT_PUBLIC_APP_URL || "https://usekvik.com"}/onboarding/instagram-callback`;
  }
  if (process.env.NEXT_PUBLIC_META_INSTAGRAM_REDIRECT_URI) {
    return process.env.NEXT_PUBLIC_META_INSTAGRAM_REDIRECT_URI;
  }
  return `${window.location.origin}/onboarding/instagram-callback`;
};

const DEFAULT_SCOPES = [
  "instagram_business_basic",
  "instagram_business_manage_messages",
  "instagram_business_manage_comments",
];

export function InstagramFlow({ onSuccess, onCancel }: InstagramFlowProps) {
  const t = useTranslations("onboarding.channel");
  const [configLoading, setConfigLoading] = useState(true);
  const instagramAppIdRef = useRef<string>("");
  const appIdRef = useRef<string>("");
  const scopesRef = useRef<string>(DEFAULT_SCOPES.join(","));

  const { flowState, setFlowState, error, setError, openOAuthPopup } =
    useOAuthChannel<InstagramChannelMetadata>({
      channelType: "INSTAGRAM",
      onSuccess,
      connectApi: async ({ code, redirectUri }) => {
        return connectInstagram({
          code,
          redirectUri: redirectUri || getCallbackUri(),
        });
      },
    });

  // Load Meta/Instagram config on mount
  useEffect(() => {
    let cancelled = false;

    const loadConfig = async () => {
      try {
        const cfg: MetaConfig = await getMetaConfig();
        if (cancelled) return;

        if (cfg.instagramAppId) {
          instagramAppIdRef.current = cfg.instagramAppId;
        }
        if (cfg.appId) {
          appIdRef.current = cfg.appId;
        }
        if (cfg.instagramScopes && cfg.instagramScopes.length > 0) {
          scopesRef.current = cfg.instagramScopes.join(",");
        }
        setFlowState("ready");
      } catch {
        // Fallback to ready with whatever defaults
        if (!cancelled) setFlowState("ready");
      } finally {
        if (!cancelled) setConfigLoading(false);
      }
    };

    void loadConfig();
    return () => {
      cancelled = true;
    };
  }, [setFlowState]);

  const handleLaunchOAuth = () => {
    const clientId = instagramAppIdRef.current || appIdRef.current;
    if (!clientId) {
      setError(t("instagram_flow_error"));
      return;
    }

    try {
      const redirectUri = getCallbackUri();
      const params = new URLSearchParams({
        enable_fb_login: "0",
        force_authentication: "1",
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: "code",
        scope: scopesRef.current,
      });

      const oauthUrl = `https://www.instagram.com/oauth/authorize?${params.toString()}`;
      openOAuthPopup(oauthUrl, "instagram-oauth");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("instagram_flow_error"));
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
      className="mt-4 p-5 rounded-2xl bg-primary/[0.04] border border-primary/20"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
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

      {/* Prerequisites / Direct Info */}
      <div className="mb-4 p-3 rounded-xl bg-amber-500/[0.07] border border-amber-500/20">
        <p className="text-[11px] font-bold text-amber-700 dark:text-amber-400 mb-1.5">
          {t("instagram_flow_prereq_title")}
        </p>
        <div className="flex items-start gap-2">
          <span className="text-amber-500 text-xs shrink-0 mt-0.5">⚠</span>
          <p className="text-xs text-foreground leading-relaxed">
            {t("instagram_flow_prereq1")}
          </p>
        </div>
      </div>

      {/* Error Banner */}
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

      {/* CTA Button */}
      <motion.button
        type="button"
        onClick={handleLaunchOAuth}
        disabled={isBusy}
        whileTap={{ scale: 0.98 }}
        className="w-full py-2.5 text-xs font-bold rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2 shadow-xs"
      >
        {isBusy ? (
          <>
            <span className="w-3.5 h-3.5 border-2 border-primary-foreground/40 border-t-primary-foreground rounded-full animate-spin" />
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
