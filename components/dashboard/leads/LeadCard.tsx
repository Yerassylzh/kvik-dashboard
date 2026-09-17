"use client";

import React from "react";
import { Clock, User, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { InteractiveCard } from "@/components/ui/motion/InteractiveCard";
import { StatusBadge } from "@/components/dashboard/shared/StatusBadge";
import { EntityAvatar } from "@/components/dashboard/shared/EntityAvatar";
import { ChannelIcon } from "@/components/ui/channel-icon";
import type { LeadDto } from "@/lib/api/leads";

interface LeadCardProps {
  lead: LeadDto;
  onSelect: (lead: LeadDto) => void;
  onMoveStage?: (leadId: string, targetStage: any) => void;
}

const channelColors: Record<string, string> = {
  WHATSAPP: "text-emerald-500",
  INSTAGRAM: "text-pink-500",
  TELEGRAM: "text-sky-500",
};

export function LeadCard({ lead, onSelect }: LeadCardProps) {
  const t = useTranslations("dashboard");
  const formattedDate = lead.lastActivityAt
    ? new Date(lead.lastActivityAt).toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

  const channelColor = lead.sourceChannel ? channelColors[lead.sourceChannel] || "text-primary" : "";

  return (
    <InteractiveCard
      onClick={() => onSelect(lead)}
      className="p-3.5 rounded-xl bg-card border border-border/60 hover:border-primary/40 transition-all shadow-xs cursor-pointer space-y-3"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <EntityAvatar name={lead.name || "Лид"} size="sm" />
          <div className="min-w-0">
            <h4 className="font-semibold text-sm text-foreground truncate">
              {lead.name || "Без имени"}
            </h4>
            {lead.phone && (
              <p className="text-xs text-muted-foreground font-mono truncate">{lead.phone}</p>
            )}
            {lead.assignedStaff && (
              <p className="flex items-center gap-1 text-[11px] text-muted-foreground truncate mt-0.5">
                <User className="w-2.5 h-2.5 text-muted-foreground shrink-0" />
                <span className="truncate">{lead.assignedStaff.name}</span>
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-1 shrink-0">
          {lead.sourceChannel && (
            <span className={`p-1 rounded-md bg-muted/60 ${channelColor}`}>
              <ChannelIcon type={lead.sourceChannel} className="w-3.5 h-3.5" />
            </span>
          )}
          {typeof lead.score === "number" && lead.score > 0 && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-bold bg-primary/10 text-primary font-mono tabular-nums">
              <Sparkles className="w-2.5 h-2.5" />
              {lead.score}
            </span>
          )}
        </div>
      </div>

      {lead.status === "DEAL_LOST" && lead.lossReason && (
        <div className="text-[11px] text-rose-600 dark:text-rose-400 bg-rose-50/70 dark:bg-rose-950/20 px-2 py-0.5 rounded-md border border-rose-200 dark:border-rose-900/40 truncate">
          {t(`leads.loss_reason_${lead.lossReason}` as any)}
        </div>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-border/40 text-[11px] text-muted-foreground">
        <div className="flex items-center gap-1 font-mono">
          <Clock className="w-3 h-3 text-muted-foreground" />
          <span>{formattedDate}</span>
        </div>
        <StatusBadge type="lead" status={lead.status} />
      </div>
    </InteractiveCard>
  );
}

