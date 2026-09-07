"use client";

import { useEffect } from "react";

/**
 * Instagram OAuth Callback Page
 *
 * Meta redirects here after the user authorizes the Instagram connection.
 * This page reads the `?code=` query param and postMessages it back to the
 * opener (InstagramFlow component), then closes itself.
 *
 * URL: /onboarding/instagram-callback
 */
export default function InstagramCallbackPage() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const error = params.get("error");

    if (window.opener) {
      if (code) {
        window.opener.postMessage(
          { type: "INSTAGRAM_OAUTH_CODE", code },
          window.location.origin
        );
      } else {
        window.opener.postMessage(
          { type: "INSTAGRAM_OAUTH_ERROR", error: error ?? "unknown" },
          window.location.origin
        );
      }
      window.close();
    }
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 text-center p-8">
        <div className="w-10 h-10 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">
          Подключение Instagram...
        </p>
      </div>
    </div>
  );
}
