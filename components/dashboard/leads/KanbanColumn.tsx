"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { LeadCard } from "./LeadCard";
import type { LeadDto, LeadStatus } from "@/lib/api/leads";
import { StaggerContainer, StaggerItem } from "@/components/ui/motion/StaggerContainer";

interface KanbanColumnProps {
  id: LeadStatus;
  title: string;
  count: number;
  leads: LeadDto[];
  colorDotClass: string;
  onSelectLead: (lead: LeadDto) => void;
  onMoveStage?: (leadId: string, targetStage: LeadStatus) => void;
}

export function KanbanColumn({
  id,
  title,
  count,
  leads,
  colorDotClass,
  onSelectLead,
  onMoveStage,
}: KanbanColumnProps) {
  const t = useTranslations("dashboard");

  return (
    <div className="flex flex-col flex-shrink-0 w-80 bg-muted/25 border border-border/60 rounded-2xl p-3 min-h-[500px]">
      <div className="flex items-center justify-between pb-3 px-1 border-b border-border/40">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${colorDotClass}`} />
          <h3 className="font-bold text-xs uppercase tracking-wider text-foreground">
            {title}
          </h3>
        </div>
        <span className="text-xs font-mono font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full tabular-nums">
          {count}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2.5 pt-3">
        {leads.length === 0 ? (
          <div className="h-32 flex items-center justify-center border border-dashed border-border/40 rounded-xl text-xs text-muted-foreground">
            {t("leads.timeline_empty")}
          </div>
        ) : (
          <StaggerContainer className="space-y-2.5">
            {leads.map((lead) => (
              <StaggerItem key={lead.id}>
                <LeadCard lead={lead} onSelect={onSelectLead} onMoveStage={onMoveStage} />
              </StaggerItem>
            ))}
          </StaggerContainer>
        )}
      </div>
    </div>
  );
}

