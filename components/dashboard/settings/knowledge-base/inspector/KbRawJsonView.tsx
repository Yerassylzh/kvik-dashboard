"use client";

import React from "react";
import { useTranslations } from "next-intl";

interface KbRawJsonViewProps {
  isLoading: boolean;
  rawJsonString: string;
}

export function KbRawJsonView({ isLoading, rawJsonString }: KbRawJsonViewProps) {
  const t = useTranslations("dashboard");

  return (
    <div className="space-y-2">
      <div className="rounded-2xl bg-muted/40 border border-border/60 p-4 max-h-80 overflow-y-auto font-mono text-[11px] text-foreground leading-relaxed select-text">
        {isLoading ? (
          <div className="py-12 text-center text-xs text-muted-foreground">
            {t("knowledge.loading_data")}
          </div>
        ) : (
          <pre className="whitespace-pre-wrap break-words">{rawJsonString}</pre>
        )}
      </div>
      <div className="text-[11px] text-muted-foreground px-1">
        {t("knowledge.raw_json_hint")}
      </div>
    </div>
  );
}
