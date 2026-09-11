"use client";

import React from "react";
import { KanbanColumn } from "./KanbanColumn";
import type { LeadDto, LeadStatus, LeadCountsDto } from "@/lib/api/leads";

interface LeadsKanbanProps {
  leads: LeadDto[];
  counts?: LeadCountsDto;
  onSelectLead: (lead: LeadDto) => void;
  onMoveStage: (leadId: string, targetStage: LeadStatus) => void;
}

const columnsConfig: Array<{ id: LeadStatus; title: string; colorDot: string }> = [
  { id: "NEW", title: "Новые", colorDot: "bg-blue-500" },
  { id: "QUALIFIED", title: "Квалифицирован", colorDot: "bg-amber-500" },
  { id: "APPOINTMENT_SET", title: "Запись создана", colorDot: "bg-purple-500" },
  { id: "DEAL_WON", title: "Успешно (Визит)", colorDot: "bg-emerald-500" },
  { id: "DEAL_LOST", title: "Отказ", colorDot: "bg-rose-500" },
];

export function LeadsKanban({
  leads,
  counts,
  onSelectLead,
  onMoveStage,
}: LeadsKanbanProps) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-6 pt-1">
      {columnsConfig.map((col) => {
        const columnLeads = leads.filter((l) => l.status === col.id);
        const count = counts ? counts[col.id] || 0 : columnLeads.length;

        return (
          <KanbanColumn
            key={col.id}
            id={col.id}
            title={col.title}
            count={count}
            leads={columnLeads}
            colorDotClass={col.colorDot}
            onSelectLead={onSelectLead}
            onMoveStage={onMoveStage}
          />
        );
      })}
    </div>
  );
}
