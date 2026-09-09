"use client";

import React, { useEffect, useState, useRef } from "react";
import { connectWhatsApp } from "@/lib/api/channels";

/**
 * WhatsApp OAuth Callback Page
 *
 * Meta redirects here with ?code=...
 * 1. Directly calls backend POST /channels/whatsapp/connect
 * 2. Broadcasts completion to opener / BroadcastChannel / localStorage
 * 3. Shows live progress & error messages, then closes
 */
export default function WhatsAppCallbackPage() {
  const [status, setStatus] = useState<"processing" | "success" | "error">("processing");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [phoneDetail, setPhoneDetail] = useState<string | null>(null);
  const executedRef = useRef(false);

  useEffect(() => {
    if (executedRef.current) return;
    executedRef.current = true;

    const urlParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, "?"));

    const code = urlParams.get("code") || hashParams.get("code");
    const error =
      urlParams.get("error") ||
      urlParams.get("error_description") ||
      hashParams.get("error") ||
      hashParams.get("error_description");

    if (error) {
      setStatus("error");
      setErrorMessage(error);
      notifyOpener({ type: "WHATSAPP_OAUTH_ERROR", error });
      return;
    }

    if (!code) {
      setStatus("error");
      setErrorMessage("Код авторизации не найден в URL перенаправления Meta");
      return;
    }

    console.log("[WhatsApp Callback Page] Received authorization code:", code);

    // Direct Backend Connection from Callback Page
    const runConnection = async () => {
      try {
        setStatus("processing");
        const redirectUri = `${window.location.origin}${window.location.pathname}`;

        // 1. Send code to opener window first
        notifyOpener({
          type: "WHATSAPP_OAUTH_CODE",
          code,
        });

        // 2. Immediately send code to backend
        console.log("[WhatsApp Callback Page] Sending POST /channels/whatsapp/connect with code and redirectUri:", redirectUri);
        const res = await connectWhatsApp({
          code,
          redirectUri,
        });
        console.log("[WhatsApp Callback Page] Backend connection successful:", res);

        const meta = res.channel?.metadata as Record<string, unknown> | undefined;
        const phone = (meta?.displayPhoneNumber as string) || (meta?.verifiedName as string) || undefined;
        if (phone) setPhoneDetail(phone);

        setStatus("success");

        // 2. Broadcast success to parent window
        notifyOpener({
          type: "WHATSAPP_CONNECTED",
          code,
          channel: res.channel,
        });

        // 3. Auto-close popup after short delay
        setTimeout(() => {
          try {
            window.close();
          } catch {
            // Popup close blocked by browser policy
          }
        }, 1200);
      } catch (err) {
        setStatus("error");
        const msg = err instanceof Error ? err.message : "Ошибка подключения WhatsApp";
        setErrorMessage(msg);
        notifyOpener({ type: "WHATSAPP_OAUTH_ERROR", error: msg });
      }
    };

    void runConnection();
  }, []);

  const notifyOpener = (payload: Record<string, unknown>) => {
    // 1. PostMessage to opener
    try {
      if (window.opener) {
        window.opener.postMessage(payload, "*");
      }
    } catch {
      // cross-origin
    }

    // 2. BroadcastChannel
    try {
      if (typeof BroadcastChannel !== "undefined") {
        const bc = new BroadcastChannel("kvik_auth_channel");
        bc.postMessage(payload);
        bc.close();
      }
    } catch {
      // noop
    }

    // 3. LocalStorage
    try {
      localStorage.setItem("kvik_oauth_payload", JSON.stringify({ ...payload, timestamp: Date.now() }));
    } catch {
      // noop
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 text-center">
      <div className="max-w-md w-full p-8 rounded-3xl bg-card border border-border shadow-lg flex flex-col items-center gap-4">
        {status === "processing" && (
          <>
            <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
            <h3 className="text-base font-bold text-foreground">
              Подключение WhatsApp...
            </h3>
            <p className="text-xs text-muted-foreground">
              Выполняем регистрацию номера и привязку вебхуков на сервере
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-2xl text-emerald-600 dark:text-emerald-400">
              ✓
            </div>
            <h3 className="text-base font-bold text-foreground">
              WhatsApp успешно подключен!
            </h3>
            {phoneDetail && (
              <div className="px-3 py-1 rounded-xl bg-muted border border-border text-xs font-mono font-semibold text-foreground">
                {phoneDetail}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Окно закроется автоматически.
            </p>
            <button
              type="button"
              onClick={() => window.close()}
              className="mt-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              Закрыть окно
            </button>
          </>
        )}

        {status === "error" && (
          <>
            <div className="w-14 h-14 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center text-2xl text-destructive">
              ✕
            </div>
            <h3 className="text-base font-bold text-foreground">
              Ошибка подключения WhatsApp
            </h3>
            <p className="text-xs text-destructive leading-relaxed">
              {errorMessage || "Не удалось завершить подключение на сервере."}
            </p>
            <button
              type="button"
              onClick={() => window.close()}
              className="mt-2 px-6 py-2.5 rounded-xl border border-border text-foreground hover:bg-muted text-xs font-semibold transition-colors cursor-pointer"
            >
              Закрыть окно
            </button>
          </>
        )}
      </div>
    </div>
  );
}
