"use client";

import React from "react";
import { TrendingUp } from "lucide-react";
import { useTranslations } from "next-intl";
import { KanbanColumn } from "./KanbanColumn";
import type { LeadDto, LeadStatus, LeadCountsResponseDto } from "@/lib/api/leads";

interface LeadsKanbanProps {
  leads: LeadDto[];
  counts?: LeadCountsResponseDto;
  onSelectLead: (lead: LeadDto) => void;
  onMoveStage: (leadId: string, targetStage: LeadStatus) => void;
}

const columnsConfig: Array<{ id: LeadStatus; labelKey: string; colorDot: string }> = [
  { id: "NEW", labelKey: "leads.stage_new", colorDot: "bg-blue-500" },
  { id: "APPOINTMENT_SET", labelKey: "leads.stage_appointment", colorDot: "bg-purple-500" },
  { id: "DEAL_WON", labelKey: "leads.stage_won", colorDot: "bg-emerald-500" },
  { id: "DEAL_LOST", labelKey: "leads.stage_lost", colorDot: "bg-rose-500" },
];

export function LeadsKanban({
  leads,
  counts,
  onSelectLead,
  onMoveStage,
}: LeadsKanbanProps) {
  const t = useTranslations("dashboard");

  return (
    <div className="space-y-3">
      {/* Top Conversion Bar if counts available */}
      {counts && typeof counts.conversionRate === "number" && (
        <div className="flex items-center justify-between px-1 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 font-semibold text-foreground">
              <TrendingUp className="w-3.5 h-3.5 text-primary" />
              {t("leads.conversion_rate_label")}:
            </span>
            <span className="font-bold text-primary font-mono tabular-nums">
              {counts.conversionRate.toFixed(1)}%
            </span>
          </div>

          <div className="text-[11px] font-mono tabular-nums">
            Активных: {counts.totalActive}
          </div>
        </div>
      )}

      <div className="flex gap-4 overflow-x-auto pb-6 pt-1">
        {columnsConfig.map((col) => {
          const columnLeads = leads.filter((l) =>
            col.id === "NEW" ? l.status === "NEW" || (l.status as string) === "QUALIFIED" : l.status === col.id
          );
          const count = counts?.counts ? counts.counts[col.id] ?? columnLeads.length : columnLeads.length;

          return (
            <KanbanColumn
              key={col.id}
              id={col.id}
              title={t(col.labelKey as any)}
              count={count}
              leads={columnLeads}
              colorDotClass={col.colorDot}
              onSelectLead={onSelectLead}
              onMoveStage={onMoveStage}
            />
          );
        })}
      </div>
    </div>
  );
}

