"use client";

import React from "react";
import { Clock } from "lucide-react";
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
          </div>
        </div>

        {lead.sourceChannel && (
          <span className={`p-1 rounded-md bg-muted/60 ${channelColor}`}>
            <ChannelIcon type={lead.sourceChannel} className="w-3.5 h-3.5" />
          </span>
        )}
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-border/40 text-[11px] text-muted-foreground">
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3 text-muted-foreground" />
          <span>{formattedDate}</span>
        </div>
        <StatusBadge type="lead" status={lead.status} />
      </div>
    </InteractiveCard>
  );
}
