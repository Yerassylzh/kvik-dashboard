"use client";

import React from "react";
import { useTranslations } from "next-intl";

interface LeadProfileNicheDataProps {
  nicheData?: Record<string, unknown> | null;
}

export function LeadProfileNicheData({ nicheData }: LeadProfileNicheDataProps) {
  const t = useTranslations("dashboard");

  if (!nicheData || typeof nicheData !== "object" || Object.keys(nicheData).length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
        {t("leads.detail_interest")}
      </h4>
      <div className="p-3 rounded-xl bg-card border border-border/50 text-xs text-foreground space-y-1">
        {Object.entries(nicheData).map(([k, v]) => (
          <div key={k} className="flex justify-between gap-2">
            <span className="text-muted-foreground capitalize">{k}:</span>
            <span className="font-medium text-right truncate max-w-[220px]">{String(v)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
