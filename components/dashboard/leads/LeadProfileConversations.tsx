"use client";

import React from "react";
import Link from "next/link";
import { MessageSquare, ExternalLink } from "lucide-react";
import { useTranslations } from "next-intl";
import type { LeadDetailDto } from "@/lib/api/leads";

interface LeadProfileConversationsProps {
  conversations?: LeadDetailDto["conversations"];
}

export function LeadProfileConversations({ conversations }: LeadProfileConversationsProps) {
  const t = useTranslations("dashboard");

  return (
    <div className="space-y-2">
      <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
        {t("leads.detail_dialogues")}
      </h4>
      {!conversations || conversations.length === 0 ? (
        <p className="text-xs text-muted-foreground py-1">Диалогов пока нет</p>
      ) : (
        <div className="space-y-1.5">
          {conversations.map((conv) => (
            <Link
              key={conv.id}
              href={`/inbox/${conv.id}`}
              className="flex items-center justify-between p-2.5 rounded-xl bg-card border border-border/50 hover:border-primary/40 transition-colors"
            >
              <div className="flex items-center gap-2">
                <MessageSquare className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-medium text-foreground">
                  Диалог ({conv.channelType})
                </span>
              </div>
              <ExternalLink className="w-3 h-3 text-muted-foreground" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
