"use client";

import React, { useState } from "react";
import useSWR from "swr";
import { ChevronDown, ChevronUp, Paperclip, Brain, AlertTriangle, User, Zap, HelpCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import clsx from "clsx";
import { conversationsApi } from "@/lib/api/conversations";
import type { EscalationDto } from "@/lib/api/conversations";

interface EscalationHistoryPanelProps {
  conversationId: string;
}

type TriggerInfo = {
  icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
  labelKey: string;
};

const TRIGGER_MAP: Record<string, TriggerInfo> = {
  MEDIA_ATTACHMENT: {
    icon: Paperclip,
    colorClass: "text-sky-600 bg-sky-50 border-sky-200",
    labelKey: "inbox.escalation_trigger_media",
  },
  KNOWLEDGE_GAP: {
    icon: Brain,
    colorClass: "text-violet-600 bg-violet-50 border-violet-200",
    labelKey: "inbox.escalation_trigger_knowledge",
  },
  COMPLAINT: {
    icon: AlertTriangle,
    colorClass: "text-red-600 bg-red-50 border-red-200",
    labelKey: "inbox.escalation_trigger_complaint",
  },
  EXPLICIT_REQUEST: {
    icon: User,
    colorClass: "text-amber-600 bg-amber-50 border-amber-200",
    labelKey: "inbox.escalation_trigger_explicit",
  },
  AI_FAILURE: {
    icon: Zap,
    colorClass: "text-orange-600 bg-orange-50 border-orange-200",
    labelKey: "inbox.escalation_trigger_ai_failure",
  },
  POLICY_EDGE_CASE: {
    icon: HelpCircle,
    colorClass: "text-slate-600 bg-slate-50 border-slate-200",
    labelKey: "inbox.escalation_trigger_policy",
  },
  SPECIALIST_REQUIRED: {
    icon: User,
    colorClass: "text-indigo-600 bg-indigo-50 border-indigo-200",
    labelKey: "inbox.escalation_trigger_specialist",
  },
};

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function EscalationHistoryPanel({ conversationId }: EscalationHistoryPanelProps) {
  const t = useTranslations("dashboard");
  const [expanded, setExpanded] = useState(false);

  const { data: escalations, isLoading } = useSWR<EscalationDto[]>(
    conversationId ? ["escalations", conversationId] : null,
    () => conversationsApi.getEscalations(conversationId),
    { revalidateOnFocus: false }
  );

  if (isLoading || !escalations || escalations.length === 0) return null;

  return (
    <div className="border-b border-amber-200/70 bg-amber-50/60">
      {/* Collapsible header */}
      <button
        type="button"
        onClick={() => setExpanded((p) => !p)}
        className="w-full flex items-center justify-between px-4 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-100/60 transition-colors"
      >
        <span className="flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          {t("inbox.escalation_history_label")} ({escalations.length})
        </span>
        {expanded ? (
          <ChevronUp className="w-3.5 h-3.5 shrink-0" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 shrink-0" />
        )}
      </button>

      {/* Entries */}
      {expanded && (
        <div className="px-4 pb-3 space-y-2">
          {escalations.map((esc) => {
            const info = TRIGGER_MAP[esc.triggerType] ?? {
              icon: HelpCircle,
              colorClass: "text-slate-600 bg-slate-50 border-slate-200",
              labelKey: "inbox.escalation_trigger_unknown",
            };
            const Icon = info.icon;

            return (
              <div
                key={esc.id}
                className="flex items-start gap-2.5 p-2.5 rounded-lg bg-white border border-amber-100 shadow-xs"
              >
                <div
                  className={clsx(
                    "w-6 h-6 rounded-md flex items-center justify-center shrink-0 border",
                    info.colorClass
                  )}
                >
                  <Icon className="w-3 h-3" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground">
                    {t(info.labelKey as Parameters<typeof t>[0])}
                  </p>
                  {esc.reason && (
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                      {esc.reason}
                    </p>
                  )}
                </div>

                <span className="text-[10px] text-muted-foreground whitespace-nowrap font-mono tabular-nums shrink-0 mt-0.5">
                  {formatDateTime(esc.triggeredAt)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
