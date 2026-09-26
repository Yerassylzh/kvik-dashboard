"use client";

import React, { useEffect, useState, useRef } from "react";
import { Channel } from "@/types/channels";

interface OAuthCallbackViewProps {
  channelName: string;
  channelType: "WHATSAPP" | "INSTAGRAM";
  themeColor: "purple" | "emerald";
  connectApi: (params: { code: string; redirectUri: string }) => Promise<{ channel: Channel }>;
  extractDetail: (channel: Channel) => string | undefined;
}

export function OAuthCallbackView({
  channelName,
  channelType,
  themeColor,
  connectApi,
  extractDetail,
}: OAuthCallbackViewProps) {
  const [status, setStatus] = useState<"processing" | "success" | "error">("processing");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [accountDetail, setAccountDetail] = useState<string | null>(null);
  const executedRef = useRef(false);

  useEffect(() => {
    if (executedRef.current) return;
    executedRef.current = true;

    const urlParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, "?"));

    const rawCode = urlParams.get("code") || hashParams.get("code");
    const code = rawCode ? rawCode.replace(/#_$/, "").split("#")[0] : null;

    const rawError =
      urlParams.get("error") ||
      urlParams.get("error_description") ||
      urlParams.get("error_reason") ||
      hashParams.get("error") ||
      hashParams.get("error_description") ||
      hashParams.get("error_reason");

    const errorReason =
      urlParams.get("error_reason") ||
      urlParams.get("error") ||
      hashParams.get("error_reason") ||
      hashParams.get("error");

    const codeType = channelType === "WHATSAPP" ? "WHATSAPP_OAUTH_CODE" : "INSTAGRAM_OAUTH_CODE";
    const connectedType = channelType === "WHATSAPP" ? "WHATSAPP_CONNECTED" : "INSTAGRAM_CONNECTED";
    const errorType = channelType === "WHATSAPP" ? "WHATSAPP_OAUTH_ERROR" : "INSTAGRAM_OAUTH_ERROR";

    const isCancelled =
      errorReason === "user_denied" ||
      rawError === "access_denied" ||
      (rawError && (rawError.includes("user_denied") || rawError.includes("disallowed")));

    if (rawError || isCancelled) {
      const friendlyError = isCancelled
        ? `Авторизация ${channelName} была отменена`
        : (rawError || `Ошибка авторизации ${channelName}`);
      setStatus("error");
      setErrorMessage(friendlyError);
      notifyOpener({ type: errorType, error: friendlyError });
      return;
    }

    if (!code) {
      setStatus("error");
      setErrorMessage(`Код авторизации не найден в ответе ${channelName}`);
      return;
    }

    const runConnection = async () => {
      try {
        setStatus("processing");
        const redirectUri = `${window.location.origin}${window.location.pathname}`;

        // 1. Send code to opener window immediately
        notifyOpener({
          type: codeType,
          code,
          redirectUri,
        });

        // 2. Perform backend connect
        const res = await connectApi({ code, redirectUri });

        const detail = extractDetail(res.channel);
        if (detail) setAccountDetail(detail);

        setStatus("success");

        // 3. Broadcast success
        notifyOpener({
          type: connectedType,
          code,
          channel: res.channel,
        });

        // 4. Auto-close popup
        setTimeout(() => {
          try {
            window.close();
          } catch {
            // popup close blocked by browser
          }
        }, 1200);
      } catch (err) {
        if (window.opener) {
          setTimeout(() => {
            try {
              window.close();
            } catch {
              // noop
            }
          }, 600);
        } else {
          setStatus("error");
          const msg = err instanceof Error ? err.message : `Ошибка подключения ${channelName}`;
          setErrorMessage(msg);
          notifyOpener({ type: errorType, error: msg });
        }
      }
    };

    void runConnection();
  }, [channelName, channelType, connectApi, extractDetail]);

  const notifyOpener = (payload: Record<string, unknown>) => {
    try {
      if (window.opener) {
        window.opener.postMessage(payload, "*");
      }
    } catch {
      // cross-origin
    }

    try {
      if (typeof BroadcastChannel !== "undefined") {
        const bc = new BroadcastChannel("kvik_auth_channel");
        bc.postMessage(payload);
        bc.close();
      }
    } catch {
      // noop
    }

    try {
      localStorage.setItem(
        "kvik_oauth_payload",
        JSON.stringify({ ...payload, timestamp: Date.now() })
      );
    } catch {
      // noop
    }
  };

  const isPurple = themeColor === "purple";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 text-center">
      <div className="max-w-md w-full p-8 rounded-3xl bg-card border border-border shadow-lg flex flex-col items-center gap-4">
        {status === "processing" && (
          <>
            <div
              className={`w-12 h-12 border-4 rounded-full animate-spin ${
                isPurple
                  ? "border-primary/20 border-t-primary"
                  : "border-emerald-500/20 border-t-emerald-500"
              }`}
            />
            <h3 className="text-base font-bold text-foreground">
              Подключение {channelName}...
            </h3>
            <p className="text-xs text-muted-foreground">
              Выполняем авторизацию и привязку на сервере
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <div
              className={`w-14 h-14 rounded-2xl border flex items-center justify-center text-2xl font-bold ${
                isPurple
                  ? "bg-primary/10 border-primary/20 text-primary"
                  : "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
              }`}
            >
              ✓
            </div>
            <h3 className="text-base font-bold text-foreground">
              {channelName} успешно подключен!
            </h3>
            {accountDetail && (
              <div className="px-3 py-1 rounded-xl bg-muted border border-border text-xs font-mono font-semibold text-foreground">
                {accountDetail}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Окно закроется автоматически.
            </p>
            <button
              type="button"
              onClick={() => window.close()}
              className={`mt-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs ${
                isPurple
                  ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                  : "bg-emerald-600 hover:bg-emerald-700 text-white"
              }`}
            >
              Закрыть окно
            </button>
          </>
        )}

        {status === "error" && (
          <>
            <div className="w-14 h-14 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center text-2xl text-destructive font-bold">
              ✕
            </div>
            <h3 className="text-base font-bold text-foreground">
              Ошибка подключения {channelName}
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
